import { ZodError } from "zod";
import { workerResponseSchema } from "./schemas.js";
function describeParseError(error) {
    if (error instanceof ZodError) {
        return error.issues.map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`).join("; ");
    }
    return String(error);
}
export function parseWorkerResponse(payload, context) {
    let parsedJson;
    try {
        parsedJson = JSON.parse(payload);
    }
    catch (error) {
        throw new Error(`${context} returned invalid JSON.\nPAYLOAD:\n${payload}\nERROR: ${String(error)}`);
    }
    try {
        return workerResponseSchema.parse(parsedJson);
    }
    catch (error) {
        throw new Error(`${context} returned a schema-invalid response.\nPAYLOAD:\n${payload}\nERROR: ${describeParseError(error)}`);
    }
}
