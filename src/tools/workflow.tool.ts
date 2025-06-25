import { z } from 'zod';
import { createTool, formatToolDescription } from '@/utils/tools.js';
import { n8nService } from '@/services/index.js';
import {
  ExportParamsSchema,
  ExportToolResponse,
} from '@/types/index.js';

// Export Templates as N8N Workflows
export const exportTemplates = createTool(
  'n8n_export_templates',
  formatToolDescription({
    type: 'WORKFLOW',
    description: 'Export multiple n8n templates as workflow JSON files ready for import into n8n',
    bestFor: [
      'Preparing templates for n8n import',
      'Bulk downloading workflow definitions',
      'Creating workflow collections',
      'Backing up template workflows'
    ],
    notFor: [
      'Searching templates',
      'Getting single template details',
      'Modifying template content'
    ],
    relations: {
      prerequisites: ['n8n_search_templates', 'n8n_get_template'],
      related: ['n8n_find_by_node']
    }
  }),
  ExportParamsSchema.shape,
  async (params) => {
    try {
      const exportResult = await n8nService.exportTemplates(params.templateIds);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: exportResult,
              timestamp: new Date().toISOString(),
            } as ExportToolResponse, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString(),
            } as ExportToolResponse, null, 2)
          }
        ]
      };
    }
  }
);

// Health Check Tool
export const healthCheck = createTool(
  'n8n_health_check',
  formatToolDescription({
    type: 'UTILITY',
    description: 'Check the health and availability of the n8n community API',
    bestFor: [
      'Verifying API connectivity',
      'Troubleshooting connection issues',
      'Monitoring service availability',
      'Pre-flight checks before operations'
    ],
    notFor: [
      'Getting template data',
      'Performing searches',
      'Exporting workflows'
    ],
    relations: {
      nextSteps: ['n8n_search_templates', 'n8n_list_categories']
    }
  }),
  {},
  async () => {
    try {
      const health = await n8nService.healthCheck();
      const cacheStats = n8nService.getCacheStats();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                api: health,
                cache: cacheStats,
                server: {
                  status: 'running',
                  version: '1.0.0',
                  timestamp: new Date().toISOString(),
                }
              },
              timestamp: new Date().toISOString(),
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString(),
            }, null, 2)
          }
        ]
      };
    }
  }
);

// Cache Management Tool
export const clearCache = createTool(
  'n8n_clear_cache',
  formatToolDescription({
    type: 'UTILITY',
    description: 'Clear the template cache to force fresh data retrieval from n8n API',
    bestFor: [
      'Refreshing stale template data',
      'Troubleshooting cache issues',
      'Freeing memory usage',
      'Getting latest template updates'
    ],
    notFor: [
      'Regular template operations',
      'Performance optimization',
      'Data backup'
    ],
    relations: {
      nextSteps: ['n8n_search_templates', 'n8n_health_check']
    }
  }),
  {},
  async () => {
    try {
      const statsBefore = n8nService.getCacheStats();
      n8nService.clearCache();
      const statsAfter = n8nService.getCacheStats();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                message: 'Cache cleared successfully',
                before: statsBefore,
                after: statsAfter,
                timestamp: new Date().toISOString(),
              },
              timestamp: new Date().toISOString(),
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString(),
            }, null, 2)
          }
        ]
      };
    }
  }
);

export const workflowTools = [
  exportTemplates,
  healthCheck,
  clearCache,
];