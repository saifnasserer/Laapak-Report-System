import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeApiRequest, handleApiError } from "../api.js";

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

export function registerAnalyticalTools(server: McpServer) {
  // 1. Dashboard Summary
  const DashboardSummarySchema = z.object({
    startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
    month: z.number().optional().describe("Month number (1-12)"),
    year: z.number().optional().describe("Year (e.g., 2024)"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_get_dashboard_summary",
    {
      title: "Get Dashboard Summary",
      description: `Get high-level KPI metrics (completed/cancelled reports, active clients, device sales) for a specific date range from the Laapak system.
      
      Examples:
      - Use when: "What is the completion rate this month?" -> pass month=current, year=current
      - Use when: "How many active clients were there in Jan 2024?" -> pass month=1, year=2024`,
      inputSchema: DashboardSummarySchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const queryParams: any = {};
        if (params.startDate) queryParams.startDate = params.startDate;
        if (params.endDate) queryParams.endDate = params.endDate;
        if (params.month) queryParams.month = params.month;
        if (params.year) queryParams.year = params.year;

        const data = await makeApiRequest<any>("analysis/dashboard", "GET", undefined, queryParams);
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const kpis = data.data.kpis;
          const text = `# Dashboard Summary
          
- **Total Reports**: ${kpis.totalReports}
- **Completed Reports**: ${kpis.completedReports?.value} (Trend: ${kpis.completedReports?.trend}%)
- **Cancelled Reports**: ${kpis.cancelledReports?.value} (Trend: ${kpis.cancelledReports?.trend}%)
- **Active Clients**: ${kpis.activeClientsCount?.value}
- **Completion Rate**: ${kpis.completionRate?.value}%
- **Devices Sold**: ${kpis.devicesSold?.value}`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data.data, null, 2) }], structuredContent: data.data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 2. Search Reports
  const SearchReportsSchema = z.object({
    query: z.string().min(1).describe("Search string to match against client name, order number, device model, or serial number"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_search_reports",
    {
      title: "Search Reports",
      description: "Search through system reports by client name, order number, device model, or serial number.",
      inputSchema: SearchReportsSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<any>("reports/search", "GET", undefined, { q: params.query });
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          if (!data || data.length === 0) return { content: [{ type: "text", text: `No reports found for query: ${params.query}` }] };
          
          let text = `# Report Search Results for "${params.query}"\nFound ${data.length} reports.\n\n`;
          for (const r of data.slice(0, 20)) {
            text += `## Report #${r.id} (${r.order_number})\n`;
            text += `- **Client**: ${r.client_name}\n`;
            text += `- **Device**: ${r.device_model} (SN: ${r.serial_number})\n`;
            text += `- **Status**: ${r.status}\n`;
            text += `- **Date**: ${new Date(r.inspection_date).toLocaleDateString()}\n\n`;
          }
          if (data.length > 20) text += `\n*Showing first 20 results.*`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 3. Get Frequent Specs
  const FrequentSpecsSchema = z.object({
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_get_frequent_specs",
    {
      title: "Get Frequent Specifications",
      description: "Get the most frequent hardware specifications (CPU, GPU, RAM, Storage) across all reports.",
      inputSchema: FrequentSpecsSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<any>("reports/stats/frequent-specs", "GET");
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const formatCat = (items: any[]) => items?.map(i => `- ${i.value} (${i.count})`).join('\n') || '- None';
          
          const text = `# Frequent Hardware Specifications
          
## Top CPUs
${formatCat(data.cpu)}

## Top GPUs
${formatCat(data.gpu)}

## Top RAM
${formatCat(data.ram)}

## Top Storage
${formatCat(data.storage)}`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 4. Financial Summary
  const FinancialSummarySchema = z.object({
    startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_get_financial_summary",
    {
      title: "Get Financial Summary",
      description: "Get financial KPIs including revenue, COGS (Cost of Goods Sold), expenses, and net profit.",
      inputSchema: FinancialSummarySchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const queryParams: any = {};
        if (params.startDate) queryParams.startDate = params.startDate;
        if (params.endDate) queryParams.endDate = params.endDate;

        // Uses enhanced external API
        const data = await makeApiRequest<any>("v2/external/financial/summary", "GET", undefined, queryParams);
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const s = data.summary;
          const text = `# Financial Summary (${data.period.startDate} to ${data.period.endDate})
          
- **Revenue**: ${s.revenue}
- **COGS (Cost of Goods Sold)**: ${s.cogs}
- **Gross Profit**: ${s.grossProfit}
- **Expenses**: ${s.expenses}
- **Net Profit**: ${s.netProfit}
- **Profit Margin**: ${s.profitMargin.toFixed(2)}%`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 5. Client Data Export
  const ClientDataExportSchema = z.object({
    clientId: z.string().describe("The ID of the client to export data for"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.JSON).describe("Output format (JSON recommended for exports)")
  }).strict();

  server.registerTool(
    "laapak_get_client_data_export",
    {
      title: "Client Data Export",
      description: "Get a comprehensive overview of a specific client, including all their reports, invoices, and a financial summary.",
      inputSchema: ClientDataExportSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const data = await makeApiRequest<any>(`v2/external/clients/${params.clientId}/data-export`, "GET");
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const text = `# Client Data Export: ${data.data?.client?.name || params.clientId}
          
- **Total Reports**: ${data.data?.summary?.total_reports}
- **Total Invoices**: ${data.data?.summary?.total_invoices}
- **Total Spent**: ${data.data?.summary?.total_amount}

*Note: For detailed item lists, please request JSON response format.*`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
