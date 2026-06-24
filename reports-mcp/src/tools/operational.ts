import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { makeApiRequest, handleApiError } from "../api.js";

enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

export function registerOperationalTools(server: McpServer) {
  // 1. Health Check
  const HealthCheckSchema = z.object({
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_check_health",
    {
      title: "Check System Health",
      description: "Perform a system health check, verifying database connections and table integrity.",
      inputSchema: HealthCheckSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        const healthData = await makeApiRequest<any>("health", "GET");
        const tablesData = await makeApiRequest<any>("health/db-tables", "GET");
        
        const combined = { health: healthData, dbTables: tablesData };
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const text = `# System Health Status
          
**API Status**: ${healthData.status}
**Database**: ${healthData.database}
**Message**: ${healthData.message}

## Database Tables
- **Reports**: ${tablesData.tables?.reports?.exists ? '✅' : '❌'} (${tablesData.tables?.reports?.count || 0})
- **Technical Tests**: ${tablesData.tables?.report_technical_tests?.exists ? '✅' : '❌'}
- **External Inspections**: ${tablesData.tables?.report_external_inspection?.exists ? '✅' : '❌'}`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(combined, null, 2) }], structuredContent: combined };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 2. Lookup Client
  const LookupClientSchema = z.object({
    phone: z.string().optional().describe("Phone number of the client"),
    email: z.string().optional().describe("Email address of the client"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_lookup_client",
    {
      title: "Lookup Client",
      description: "Find a client's profile by their phone number or email address.",
      inputSchema: LookupClientSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async (params) => {
      try {
        if (!params.phone && !params.email) {
          return { content: [{ type: "text", text: "Error: Either phone or email must be provided." }] };
        }

        const queryParams: any = {};
        if (params.phone) queryParams.phone = params.phone;
        if (params.email) queryParams.email = params.email;

        const data = await makeApiRequest<any>("v2/external/clients/lookup", "GET", undefined, queryParams);
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const c = data.client;
          const text = `# Client Found
          
- **ID**: ${c.id}
- **Name**: ${c.name}
- **Phone**: ${c.phone}
- **Email**: ${c.email || 'N/A'}
- **Status**: ${c.status}
- **Created**: ${new Date(c.createdAt).toLocaleDateString()}`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  // 3. Create Expense
  const CreateExpenseSchema = z.object({
    name: z.string().describe("Name of the expense"),
    name_ar: z.string().optional().describe("Arabic name of the expense"),
    amount: z.number().positive().describe("Expense amount"),
    category_id: z.number().int().positive().describe("Category ID"),
    type: z.string().describe("Expense type (e.g., operational, equipment)"),
    date: z.string().describe("Expense date (YYYY-MM-DD)"),
    description: z.string().optional().describe("Detailed description"),
    response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("Output format")
  }).strict();

  server.registerTool(
    "laapak_create_expense",
    {
      title: "Create Expense",
      description: "Record a new operational expense in the financial system.",
      inputSchema: CreateExpenseSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (params) => {
      try {
        const payload = {
          name: params.name,
          name_ar: params.name_ar,
          amount: params.amount,
          category_id: params.category_id,
          type: params.type,
          date: params.date,
          description: params.description
        };

        const data = await makeApiRequest<any>("v2/external/financial/expenses", "POST", payload);
        
        if (params.response_format === ResponseFormat.MARKDOWN) {
          const text = `# Expense Created Successfully ✅
          
- **Expense ID**: ${data.data?.id}
- **Name**: ${data.data?.name}
- **Amount**: ${data.data?.amount}
- **Status**: ${data.data?.status}`;
          return { content: [{ type: "text", text }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
