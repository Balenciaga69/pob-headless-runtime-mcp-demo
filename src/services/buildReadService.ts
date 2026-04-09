import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";
import { callTransientPobWorker } from "../worker/transientClient.js";

export async function summarizeCurrentBuild() {
  return getPersistentPobWorker().send(createWorkerRequest("get_summary", {}));
}

export async function summarizeBuildIsolated(buildCode: string, buildName?: string) {
  return callTransientPobWorker(
    createWorkerRequest("get_summary", {
      build_code: buildCode,
      ...(buildName ? { build_name: buildName } : {}),
    }),
  );
}

export async function getCurrentBuildStats(fields: string[]) {
  return getPersistentPobWorker().send(
    createWorkerRequest("get_stats", {
      fields,
    }),
  );
}

export async function getCurrentDisplayStats() {
  return getPersistentPobWorker().send(createWorkerRequest("get_display_stats", {}));
}

export async function listCurrentEquipment() {
  return getPersistentPobWorker().send(createWorkerRequest("list_equipment", {}));
}

export async function getCurrentConfig() {
  return getPersistentPobWorker().send(createWorkerRequest("get_config", {}));
}
