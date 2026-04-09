import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerDemoTools } from "./mcp/registerTools.js";
import { createMcpDemoServer } from "./mcp/server.js";

async function main() {
  const server = createMcpDemoServer();
  registerDemoTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP server failed:", error);
  process.exit(1);
});
