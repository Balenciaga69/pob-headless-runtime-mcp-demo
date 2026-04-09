import { randomUUID } from "node:crypto";
export function createWorkerRequest(method, params) {
    return {
        id: randomUUID(),
        method,
        params,
    };
}
