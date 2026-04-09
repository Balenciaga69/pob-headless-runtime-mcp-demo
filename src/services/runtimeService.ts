import { createWorkerRequest } from "../worker/requests.js";
import { getPersistentPobWorker } from "../worker/persistentClient.js";

export async function getRuntimeHealth() {
  return getPersistentPobWorker().send(createWorkerRequest("health", {}));
}

export async function getRuntimeStatus() {
  return getPersistentPobWorker().send(createWorkerRequest("get_runtime_status", {}));
}
