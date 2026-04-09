import { z } from "zod";
import { jsonToolResult } from "../mcp/toolResult.js";
import { getRuntimeHealth, getRuntimeStatus } from "../services/runtimeService.js";
export function registerRuntimeTools(server) {
    server.registerTool("hello_world", {
        description: "Return a simple greeting so the MCP server wiring can be verified first.",
        inputSchema: {
            name: z.string().min(1).describe("Name to greet"),
        },
    }, async ({ name }) => jsonToolResult(`Hello, ${name}!`));
    server.registerTool("runtime_health", {
        description: "Check whether the current PoB runtime session is healthy.",
        inputSchema: {},
    }, async () => jsonToolResult(await getRuntimeHealth()));
    server.registerTool("runtime_status", {
        description: "Inspect the current PoB runtime status and readiness flags.",
        inputSchema: {},
    }, async () => jsonToolResult(await getRuntimeStatus()));
}
