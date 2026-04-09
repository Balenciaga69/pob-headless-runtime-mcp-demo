import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerDemoTools } from "./mcp/registerTools.js";
import { createMcpDemoServer } from "./mcp/server.js";

type DemoServer = ReturnType<typeof createMcpDemoServer>;

type HttpSession = {
  server: DemoServer;
  transport: StreamableHTTPServerTransport;
};

const HTTP_HOST = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const HTTP_PORT = Number(process.env.MCP_HTTP_PORT ?? "3386");
const HTTP_PATH = process.env.MCP_HTTP_PATH ?? "/mcp";

function createConfiguredServer() {
  const server = createMcpDemoServer();
  registerDemoTools(server);
  return server;
}

function readRequestBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      const rawBody = Buffer.concat(chunks).toString("utf8").trim();
      if (!rawBody) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(rawBody) as unknown);
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

async function startHttpPort() {
  const sessions = new Map<string, HttpSession>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? HTTP_HOST}`);
      if (url.pathname !== HTTP_PATH) {
        res.statusCode = 404;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      const sessionId = req.headers["mcp-session-id"];
      const existingSessionId = typeof sessionId === "string" ? sessionId : undefined;
      const parsedBody = req.method === "POST" ? await readRequestBody(req) : undefined;

      let session = existingSessionId ? sessions.get(existingSessionId) : undefined;
      let transport: StreamableHTTPServerTransport;

      if (session) {
        transport = session.transport;
      } else {
        if (!parsedBody || !isInitializeRequest(parsedBody)) {
          res.statusCode = existingSessionId ? 404 : 400;
          res.setHeader("content-type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: existingSessionId ? "Unknown MCP session." : "Missing initialize request.",
              },
              id: null,
            }),
          );
          return;
        }

        const server = createConfiguredServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            sessions.set(newSessionId, { server, transport });
          },
        });

        transport.onclose = () => {
          const closedSessionId = transport.sessionId;
          if (closedSessionId) {
            sessions.delete(closedSessionId);
          }

          void server.close().catch((error) => {
            console.error("HTTP MCP server close failed:", error);
          });
        };

        transport.onerror = (error) => {
          console.error("HTTP MCP transport error:", error);
        };

        await server.connect(transport);
      }

      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      console.error("HTTP MCP request failed:", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          }),
        );
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(HTTP_PORT, HTTP_HOST, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  console.error(`HTTP MCP server listening on http://${HTTP_HOST}:${HTTP_PORT}${HTTP_PATH}`);

  return httpServer;
}

async function main() {
  const stdioServer = createConfiguredServer();
  const stdioTransport = new StdioServerTransport();

  void stdioServer.connect(stdioTransport).catch((error) => {
    console.error("STDIO MCP server failed:", error);
    process.exit(1);
  });

  const httpServer = await startHttpPort();

  const shutdown = async () => {
    try {
      await closeServer(httpServer);
    } catch (error) {
      console.error("HTTP server shutdown failed:", error);
    }

    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("MCP server failed:", error);
  process.exit(1);
});
