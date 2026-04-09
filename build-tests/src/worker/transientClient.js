import { spawn } from "node:child_process";
import { createWorkerSpawnConfig, getTransientWorkerScriptPath } from "./processConfig.js";
import { parseWorkerResponse } from "./response.js";
export async function callTransientPobWorker(request) {
    const spawnConfig = createWorkerSpawnConfig(getTransientWorkerScriptPath());
    return new Promise((resolve, reject) => {
        const child = spawn(spawnConfig.command, spawnConfig.args, {
            cwd: spawnConfig.cwd,
            env: spawnConfig.env,
            stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        const finish = (callback) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeoutHandle);
            callback();
        };
        const timeoutHandle = setTimeout(() => {
            child.kill("SIGTERM");
            finish(() => {
                reject(new Error(`PoB worker timed out after ${spawnConfig.requestTimeoutMs}ms.`));
            });
        }, spawnConfig.requestTimeoutMs);
        child.on("error", (error) => {
            finish(() => {
                reject(error);
            });
        });
        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });
        child.on("close", (code, signal) => {
            finish(() => {
                const trimmedStdout = stdout.trim();
                if (!trimmedStdout) {
                    reject(new Error(`PoB worker returned no stdout. code=${String(code)} signal=${String(signal)} stderr=${stderr.trim()}`));
                    return;
                }
                let response;
                try {
                    response = parseWorkerResponse(trimmedStdout, "Transient PoB worker");
                }
                catch (error) {
                    reject(error);
                    return;
                }
                if (!response.ok) {
                    reject(new Error(`PoB worker request failed with ${response.error.code}: ${response.error.message}`));
                    return;
                }
                resolve(response.result);
            });
        });
        child.stdin.write(JSON.stringify(request));
        child.stdin.end();
    });
}
