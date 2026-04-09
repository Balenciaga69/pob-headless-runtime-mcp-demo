import { fileURLToPath } from "node:url";
import { getDemoEnvironment } from "../config/env.js";
export function getPersistentWorkerScriptPath() {
    return fileURLToPath(new URL("../../src/worker/persistent_worker.lua", import.meta.url));
}
export function getTransientWorkerScriptPath() {
    return getDemoEnvironment().jsonWorkerScript;
}
export function createWorkerSpawnConfig(scriptPath) {
    const env = getDemoEnvironment();
    return {
        command: env.luaBin,
        args: [scriptPath],
        cwd: env.hostSourceDir,
        env: {
            ...process.env,
            PATH: `${env.runtimeDir}${env.pathDelimiter}${process.env.PATH ?? ""}`,
            POB_HEADLESS_DIR: env.headlessDir,
            POB_HEADLESS_MAX_FRAMES: String(env.maxFrames),
            POB_HEADLESS_MAX_SECONDS: String(env.maxSeconds),
        },
        requestTimeoutMs: env.requestTimeoutMs,
    };
}
