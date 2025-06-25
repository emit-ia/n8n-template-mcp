#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "@/tools/index.js";
import { n8nService } from "@/services/index.js";

const server = new McpServer({
  name: "n8n-template-mcp",
  version: "1.0.0",
});

// Register all tool modules
registerAllTools(server);

// Connect server to stdio transport
async function main() {
  try {
    // Test API connectivity on startup
    const health = await n8nService.healthCheck();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error(`N8N Template MCP server running - API status: ${health.status}`);
    console.error("Available tools:");
    console.error("  • n8n_search_templates - Search community templates");
    console.error("  • n8n_get_template - Get template details");
    console.error("  • n8n_list_categories - List template categories");
    console.error("  • n8n_find_by_node - Find templates by node type");
    console.error("  • n8n_export_templates - Export templates for n8n import");
    console.error("  • n8n_health_check - Check API health");
    console.error("  • n8n_clear_cache - Clear template cache");
    
  } catch (error) {
    console.error("Warning: N8N API connectivity issue on startup:", error instanceof Error ? error.message : error);
    console.error("Server will continue running - API calls may fail until connectivity is restored");
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("N8N Template MCP server running (degraded mode)");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});