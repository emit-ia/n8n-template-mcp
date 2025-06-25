import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { templateTools } from './template.tool.js';
import { workflowTools } from './workflow.tool.js';
import { Tool } from '@/utils/tools.js';

export function registerAllTools(server: McpServer) {
  // Collect all tools
  const allTools = [
    ...templateTools,
    ...workflowTools,
  ] as Tool[];

  // Register each tool with the server
  allTools.forEach((tool) => {
    server.tool(
      ...tool
    );
  });
}

// Export individual tool collections for testing
export { templateTools, workflowTools };