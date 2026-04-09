import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const envSchema = z.object({
  POB_HEADLESS_DIR: z.string().min(1).optional(),
  POB_HEADLESS_LUA_BIN: z.string().min(1).optional(),
  POB_HEADLESS_MAX_FRAMES: z.string().optional(),
  POB_HEADLESS_MAX_SECONDS: z.string().optional(),
  POB_HEADLESS_REQUEST_TIMEOUT_MS: z.string().optional(),
});

export type DemoEnvironment = {
  headlessDir: string;
  hostRepoRoot: string;
  hostSourceDir: string;
  runtimeDir: string;
  jsonWorkerScript: string;
  luaBin: string;
  maxFrames: number;
  maxSeconds: number;
  requestTimeoutMs: number;
  pathDelimiter: string;
};

let cachedEnv: DemoEnvironment | null = null;

function getPackageRoot() {
  return fileURLToPath(new URL("../..", import.meta.url));
}

function assertPathExists(pathValue: string, description: string) {
  if (!existsSync(pathValue)) {
    throw new Error(`${description} does not exist: ${pathValue}`);
  }
}

export function getDemoEnvironment(): DemoEnvironment {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsedEnv = envSchema.parse(process.env);
  const packageRoot = getPackageRoot();
  const headlessDir = path.resolve(
    parsedEnv.POB_HEADLESS_DIR ?? path.join(packageRoot, "..", "pob-headless-runtime"),
  );
  const hostRepoRoot = path.dirname(headlessDir);
  const hostSourceDir = path.join(hostRepoRoot, "src");
  const runtimeDir = path.join(hostRepoRoot, "runtime");
  const jsonWorkerScript = path.join(headlessDir, "json_worker.lua");

  assertPathExists(headlessDir, "POB_HEADLESS_DIR");
  assertPathExists(hostSourceDir, "PoB host source directory");
  assertPathExists(runtimeDir, "PoB host runtime directory");
  assertPathExists(jsonWorkerScript, "PoB JSON worker entry");

  cachedEnv = {
    headlessDir,
    hostRepoRoot,
    hostSourceDir,
    runtimeDir,
    jsonWorkerScript,
    luaBin: parsedEnv.POB_HEADLESS_LUA_BIN ?? "luajit",
    maxFrames: Number(parsedEnv.POB_HEADLESS_MAX_FRAMES ?? "200"),
    maxSeconds: Number(parsedEnv.POB_HEADLESS_MAX_SECONDS ?? "5"),
    requestTimeoutMs: Number(parsedEnv.POB_HEADLESS_REQUEST_TIMEOUT_MS ?? "30000"),
    pathDelimiter: path.delimiter,
  };

  return cachedEnv;
}
