---
name: managing-reports-mcp
description: Handles the configuration, management, and usage of the Laapak Reports MCP server. Use when the user wants to add a new MCP tool, configure the server, or troubleshoot connections.
---

# Managing Reports MCP

## When to Use
- User asks to add a new analytical or operational tool to the MCP server.
- User needs to configure or run the `reports-mcp` server locally.
- Troubleshooting MCP connection or authentication issues.

## Architecture & Integration
- **Path:** `g:/Laapak-Report-System/reports-mcp`
- **Transport:** Standard I/O (stdio) transport, suitable for local integration.
- **Authentication:** Validated via the `x-api-key` header (default: `laapak-api-key-2024`).
- **API Client:** Axios-based central client located in `src/api.ts` that handles errors cleanly.

## Workflow for Adding a Tool
Follow these steps when instructed to add a new tool to the MCP:

- [ ] Identify if the tool is **Analytical** (`src/tools/analytical.ts`) or **Operational** (`src/tools/operational.ts`).
- [ ] Define the tool's `zod` schema (e.g., `NewToolSchema`). Include a `response_format` (markdown/json) parameter.
- [ ] Register the tool using `server.registerTool`.
- [ ] Use `makeApiRequest<T>` to fetch data from the Laapak backend.
- [ ] Provide output based on `response_format` (return formatted Markdown strings or raw JSON).
- [ ] Rebuild the project: `cd g:/Laapak-Report-System/reports-mcp && npm run build`

## Running Locally
To test the MCP server or run it using an MCP inspector/client:
```bash
node g:/Laapak-Report-System/reports-mcp/dist/index.js
```

### Environment Variables
- `API_BASE_URL` (default: `http://localhost:3001/api`)
- `API_KEY` (default: `laapak-api-key-2024`)

## Reference: Current Tools
### 📈 Analytical Tools
- `laapak_get_dashboard_summary`: Summarizes KPI metrics (completion rates, active clients, devices sold).
- `laapak_search_reports`: Full-text search for reports by client, order number, or serial number.
- `laapak_get_frequent_specs`: Aggregates the most common CPU, GPU, RAM, and Storage components.
- `laapak_get_financial_summary`: Connects to the V2 financial API to provide Revenue, COGS, Gross/Net profit, and Expenses.
- `laapak_get_client_data_export`: Pulls a full aggregate export of a client's profile.

### ⚙️ Operational Tools
- `laapak_check_health`: Diagnoses API health and DB tables.
- `laapak_lookup_client`: Searches clients by phone or email.
- `laapak_create_expense`: Automatically logs operational expenses.
