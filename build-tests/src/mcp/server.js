import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export function createMcpDemoServer() {
    return new McpServer({
        name: "pob-headless-runtime-mcp-demo",
        version: "0.1.0",
    });
}
