import { randomUUID } from "node:crypto";

import type { PobWorkerMethod, PobWorkerRequest } from "./types.js";

export function createWorkerRequest(
  method: PobWorkerMethod,
  params: Record<string, unknown>,
): PobWorkerRequest {
  return {
    id: randomUUID(),
    method,
    params,
  };
}
