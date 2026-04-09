import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import readline from "node:readline";

import { getDemoEnvironment } from "../config/env.js";
import { createWorkerSpawnConfig, getPersistentWorkerScriptPath } from "./processConfig.js";
import { parseWorkerResponse } from "./response.js";
import type { PobWorkerRequest } from "./types.js";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
};

class PersistentPobWorker {
  private process: ChildProcessWithoutNullStreams | null = null;
  private lines: readline.Interface | null = null;
  private pending = new Map<string, PendingRequest>();
  private bootPromise: Promise<void> | null = null;
  private closePromise: Promise<void> | null = null;

  async send(request: PobWorkerRequest): Promise<unknown> {
    await this.ensureStarted();

    if (!this.process) {
      throw new Error("PoB worker failed to start.");
    }

    const { requestTimeoutMs } = getDemoEnvironment();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(request.id);
        reject(new Error(`PoB worker request timed out after ${requestTimeoutMs}ms.`));
      }, requestTimeoutMs);

      this.pending.set(request.id, { resolve, reject, timeout });
      this.process!.stdin.write(`${JSON.stringify(request)}\n`);
    });
  }

  private async ensureStarted() {
    if (this.process) {
      return;
    }

    if (!this.bootPromise) {
      this.bootPromise = this.start();
    }

    return this.bootPromise;
  }

  private async start() {
    const spawnConfig = createWorkerSpawnConfig(getPersistentWorkerScriptPath());

    this.process = spawn(spawnConfig.command, spawnConfig.args, {
      cwd: spawnConfig.cwd,
      env: spawnConfig.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.process.once("error", (error) => {
      this.rejectAll(error);
      this.reset();
    });

    this.process.once("exit", (code, signal) => {
      this.rejectAll(
        new Error(
          `PoB worker exited unexpectedly (code=${String(code)}, signal=${String(signal)}).`,
        ),
      );
      this.reset();
    });

    this.process.stderr.on("data", (chunk) => {
      const message = chunk.toString().trim();
      if (message) {
        console.error("[pob-worker]", message);
      }
    });

    this.lines = readline.createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity,
    });

    this.lines.on("line", (line) => {
      if (!line.trim()) {
        return;
      }

      let response;
      try {
        response = parseWorkerResponse(line, "Persistent PoB worker");
      } catch (error) {
        this.rejectAll(error);
        void this.close();
        return;
      }

      const requestId = response.id ?? response.meta.request_id ?? "";
      const pending = this.pending.get(requestId);

      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(requestId);

      if (!response.ok) {
        pending.reject(
          new Error(
            `PoB worker request failed with ${response.error.code}: ${response.error.message}`,
          ),
        );
        return;
      }

      pending.resolve(response.result);
    });
  }

  async close() {
    if (this.closePromise) {
      return this.closePromise;
    }

    this.lines?.close();
    this.lines = null;

    const processRef = this.process;
    if (!processRef) {
      this.reset();
      return;
    }

    this.closePromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        if (!processRef.killed) {
          processRef.kill("SIGKILL");
        }
        resolve();
      }, 2000);

      processRef.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });

      if (!processRef.killed) {
        processRef.kill("SIGTERM");
      }
    }).finally(() => {
      this.closePromise = null;
      this.reset();
    });

    return this.closePromise;
  }

  private rejectAll(reason: unknown) {
    for (const [requestId, pending] of this.pending.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(reason);
      this.pending.delete(requestId);
    }
  }

  private reset() {
    this.lines?.close();
    this.lines = null;
    this.process = null;
    this.bootPromise = null;
  }
}

declare global {
  var __pobMcpPersistentWorker__: PersistentPobWorker | undefined;
}

export function getPersistentPobWorker() {
  if (!globalThis.__pobMcpPersistentWorker__) {
    globalThis.__pobMcpPersistentWorker__ = new PersistentPobWorker();
  }

  return globalThis.__pobMcpPersistentWorker__;
}

export async function shutdownPersistentPobWorker() {
  if (!globalThis.__pobMcpPersistentWorker__) {
    return;
  }

  await globalThis.__pobMcpPersistentWorker__.close();
  globalThis.__pobMcpPersistentWorker__ = undefined;
}
