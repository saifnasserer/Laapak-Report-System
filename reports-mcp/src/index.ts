#!/usr/bin/env node
/**
 * MCP Server for Laapak Report System.
 *
 * This server provides tools to interact with the Laapak REST API, including
 * analytical endpoints (reports, financial, dashboards) and operational endpoints.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { registerAnalyticalTools } from "./tools/analytical.js";
import { registerOperationalTools } from "./tools/operational.js";
import { API_KEY } from "./constants.js";

// Factory function to create a new server instance per connection
function createServerInstance() {
  const server = new McpServer({
    name: "reports-mcp-server",
    version: "1.0.0"
  });

  registerAnalyticalTools(server);
  registerOperationalTools(server);
  return server;
}

const transports = new Map<string, SSEServerTransport>();

// Main entry point
async function main() {
  if (!API_KEY) {
    console.warn("WARNING: No API_KEY provided. The server may fail to authenticate with the backend.");
  }

  if (process.env.MCP_MODE === "stdio") {
    // Run via Stdio Transport
    const server = createServerInstance();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Laapak Reports MCP server running via stdio");
  } else {
    // Run via Express SSE Transport
    const app = express();
    app.use(cors());

    app.get("/sse", async (req, res) => {
      console.error("New SSE connection established");
      // The path here must match what the external client will use to send POST requests.
      const transport = new SSEServerTransport("/mcp/messages", res);
      const server = createServerInstance();
      
      transports.set(transport.sessionId, transport);

      res.on("close", () => {
        console.error(`SSE connection closed: ${transport.sessionId}`);
        transports.delete(transport.sessionId);
      });

      await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      console.log(`Incoming POST /messages for session: ${sessionId}`);

      const transport = transports.get(sessionId);
      if (!transport) {
        console.error(`Session not found: ${sessionId}`);
        res.status(404).send("Session not found");
        return;
      }

      try {
        await transport.handlePostMessage(req, res);
      } catch (error: any) {
        console.error(`Error in handlePostMessage for session ${sessionId}:`, error);
        res.status(500).send(error.message);
      }
    });

    const PORT = process.env.PORT || 3015;
    app.listen(PORT, () => {
      console.error(`Reports MCP SSE server running on port ${PORT}`);
    });
  }
}

main().catch(error => {
  console.error("Server error:", error);
  process.exit(1);
});
