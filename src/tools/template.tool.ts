import { z } from 'zod';
import { createTool, formatToolDescription } from '@/utils/tools.js';
import { n8nService } from '@/services/index.js';
import {
  SearchParamsSchema,
  TemplateIdSchema,
  NodeTypeSchema,
  SearchToolResponse,
  TemplateToolResponse,
  CategoriesToolResponse,
  NodeSearchToolResponse,
  OptimizedSearchResult,
  OptimizedTemplate,
  OptimizedNodeSearchTemplate,
} from '@/types/index.js';

// Search N8N Templates
export const searchTemplates = createTool(
  'n8n_search_templates',
  formatToolDescription({
    type: 'API',
    description: 'Search n8n workflow templates from the community API (returns up to 10 optimized results)',
    bestFor: [
      'Finding templates for specific automation tasks',
      'Discovering workflow examples for node types',
      'Browsing templates by category or tags',
      'Getting template inspiration for projects'
    ],
    notFor: [
      'Getting detailed template implementation',
      'Downloading workflow files directly',
      'Creating new templates'
    ],
    relations: {
      nextSteps: ['n8n_get_template', 'n8n_export_templates'],
      related: ['n8n_list_categories', 'n8n_find_by_node']
    }
  }),
  SearchParamsSchema.shape,
  async (params) => {
    try {
      const result = await n8nService.searchTemplates(params);
      
      // Limit and optimize the response for Claude
      const optimizedResult: OptimizedSearchResult = {
        templates: result.templates.slice(0, 10).map(template => ({
          id: template.id,
          name: template.name,
          description: template.description.length > 200 
            ? template.description.substring(0, 200) + '...' 
            : template.description,
          category: template.category,
          subcategory: template.subcategory,
          tags: template.tags.slice(0, 5), // Limit to 5 tags
          nodeCount: template.nodes.length,
          mainNodes: template.nodes.slice(0, 3).map(n => n.type), // Show first 3 node types
          official: template.official,
          author: template.author.name,
          totalViews: template.totalViews,
          // Exclude the full workflow JSON from search results
        })),
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: result.limit
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: optimizedResult,
              timestamp: new Date().toISOString(),
            } as SearchToolResponse, null, 2)
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
            } as SearchToolResponse, null, 2)
          }
        ]
      };
    }
  }
);

// Get Template Details
export const getTemplate = createTool(
  'n8n_get_template',
  formatToolDescription({
    type: 'API',
    description: 'Get detailed information about a specific n8n template including full workflow JSON',
    bestFor: [
      'Getting complete template implementation details',
      'Reviewing template workflow structure',
      'Understanding node configurations',
      'Preparing for template import to n8n'
    ],
    notFor: [
      'Searching multiple templates',
      'Getting template lists',
      'Modifying templates'
    ],
    relations: {
      prerequisites: ['n8n_search_templates'],
      nextSteps: ['n8n_export_templates'],
      related: ['n8n_find_by_node']
    }
  }),
  TemplateIdSchema.shape,
  async (params) => {
    try {
      const template = await n8nService.getTemplate(params.templateId);
      
      // Optimize template response - include workflow but limit context
      const optimizedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        subcategory: template.subcategory,
        tags: template.tags,
        nodes: template.nodes.map(node => ({
          name: node.name,
          type: node.type,
          position: node.position,
          // Exclude detailed parameters to reduce size
          hasParameters: !!node.parameters && Object.keys(node.parameters).length > 0
        })),
        workflow: template.workflow, // Keep full workflow for export/import
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        totalViews: template.totalViews,
        official: template.official,
        author: template.author
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: optimizedTemplate,
              timestamp: new Date().toISOString(),
            } as TemplateToolResponse, null, 2)
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
            } as TemplateToolResponse, null, 2)
          }
        ]
      };
    }
  }
);

// List Categories
export const listCategories = createTool(
  'n8n_list_categories',
  formatToolDescription({
    type: 'API',
    description: 'Get all available template categories and subcategories from n8n community',
    bestFor: [
      'Browsing available template categories',
      'Understanding template organization',
      'Planning targeted template searches',
      'Getting category-based template counts'
    ],
    notFor: [
      'Searching specific templates',
      'Getting template details',
      'Creating categories'
    ],
    relations: {
      nextSteps: ['n8n_search_templates'],
      related: ['n8n_find_by_node']
    }
  }),
  {},
  async () => {
    try {
      const categories = await n8nService.getCategories();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: categories,
              timestamp: new Date().toISOString(),
            } as CategoriesToolResponse, null, 2)
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
            } as CategoriesToolResponse, null, 2)
          }
        ]
      };
    }
  }
);

// Find Templates by Node Type
export const findByNode = createTool(
  'n8n_find_by_node',
  formatToolDescription({
    type: 'API',
    description: 'Find n8n templates that use a specific node type (returns up to 8 optimized results)',
    bestFor: [
      'Finding examples for specific node types',
      'Learning node configuration patterns',
      'Discovering integration templates',
      'Understanding node usage in workflows'
    ],
    notFor: [
      'General template searching',
      'Getting node documentation',
      'Creating new node types'
    ],
    relations: {
      nextSteps: ['n8n_get_template', 'n8n_export_templates'],
      related: ['n8n_search_templates', 'n8n_list_categories']
    }
  }),
  NodeTypeSchema.shape,
  async (params) => {
    try {
      const templates = await n8nService.findTemplatesByNode(params.nodeType);
      
      // Limit and optimize node search results
      const optimizedTemplates: OptimizedNodeSearchTemplate[] = templates.slice(0, 8).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description.length > 150 
          ? template.description.substring(0, 150) + '...' 
          : template.description,
        category: template.category,
        tags: template.tags.slice(0, 3), // Limit to 3 tags
        nodeCount: template.nodes.length,
        targetNodeUsage: template.nodes.filter(n => 
          n.type.toLowerCase().includes(params.nodeType.toLowerCase())
        ).length,
        otherNodes: template.nodes
          .filter(n => !n.type.toLowerCase().includes(params.nodeType.toLowerCase()))
          .slice(0, 3)
          .map(n => n.type),
        official: template.official,
        author: template.author.name,
        totalViews: template.totalViews
      }));
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: optimizedTemplates,
              timestamp: new Date().toISOString(),
            } as NodeSearchToolResponse, null, 2)
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
            } as NodeSearchToolResponse, null, 2)
          }
        ]
      };
    }
  }
);

export const templateTools = [
  searchTemplates,
  getTemplate,
  listCategories,
  findByNode,
];