import { BaseService } from './base.service.js';
import { N8NCache } from '@/utils/cache.js';
import {
  N8NTemplate,
  N8NCategory,
  SearchResult,
  SearchParams,
  ExportResult,
  N8NClientConfig,
  N8NApiError,
} from '@/types/index.js';

export class N8NService extends BaseService {
  private cache: N8NCache;
  private config: N8NClientConfig;

  constructor(config: N8NClientConfig) {
    super(config.apiBase);
    this.config = config;
    this.cache = new N8NCache(config.cache);
  }

  async searchTemplates(params: SearchParams): Promise<SearchResult> {
    const cacheKey = JSON.stringify(params);
    
    return this.cache.cached('search', cacheKey, async () => {
      // N8N Community API endpoint structure (based on community.n8n.io)
      const searchParams = {
        page: params.page || 1,
        rows: params.limit || 24,
        search: params.query,
        category: params.category,
        subcategory: params.subcategory,
        tags: params.tags,
        // Additional filters for nodes if available
        ...(params.nodeTypes && { nodes: params.nodeTypes.join(',') }),
        ...(params.official !== undefined && { official: params.official }),
      };

      const url = this.buildUrl('/templates/search', searchParams);
      const response = await this.fetchWithRetry(url);
      const data = await this.jsonResponse<any>(response);

      return this.transformSearchResult(data, params);
    });
  }

  async getTemplate(templateId: string): Promise<N8NTemplate> {
    return this.cache.cached('template', templateId, async () => {
      const url = this.buildUrl(`/templates/workflows/${templateId}`);
      const response = await this.fetchWithRetry(url);
      const data = await this.jsonResponse<any>(response);

      return this.transformTemplate(data);
    });
  }

  async getCategories(): Promise<N8NCategory[]> {
    return this.cache.cached('categories', 'all', async () => {
      const url = this.buildUrl('/templates/categories');
      const response = await this.fetchWithRetry(url);
      const data = await this.jsonResponse<any>(response);

      return this.transformCategories(data);
    });
  }

  async findTemplatesByNode(nodeType: string): Promise<N8NTemplate[]> {
    const cacheKey = `node:${nodeType}`;
    
    return this.cache.cached('search', cacheKey, async () => {
      // Search for templates containing specific node types
      const searchParams = {
        nodes: nodeType,
        page: 1,
        rows: 50, // Reduced from 100 to 50 for better performance
      };

      const url = this.buildUrl('/templates/search', searchParams);
      const response = await this.fetchWithRetry(url);
      const data = await this.jsonResponse<any>(response);

      const searchResult = this.transformSearchResult(data, {});
      return searchResult.templates;
    });
  }

  async exportTemplates(templateIds: string[]): Promise<ExportResult> {
    // Get all templates in parallel
    const templates = await Promise.all(
      templateIds.map(id => this.getTemplate(id))
    );

    // Collect unique node types
    const nodeTypes = [...new Set(
      templates.flatMap(t => t.nodes.map(n => n.type))
    )];

    return {
      version: '1.0',
      workflows: templates.map(template => ({
        ...template.workflow,
        name: `${template.name} (imported from n8n community)`,
        tags: template.tags,
        meta: {
          templateId: template.id,
          originalName: template.name,
          category: template.category,
          author: template.author,
          importedAt: new Date().toISOString(),
        },
      })),
      exportedAt: new Date().toISOString(),
      metadata: {
        templateCount: templates.length,
        nodeTypes,
      },
    };
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const url = this.buildUrl('/health');
      const response = await this.fetchWithRetry(url, {}, 1); // Single attempt for health check
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Transform methods to normalize API responses
  private transformSearchResult(data: any, params: SearchParams): SearchResult {
    // Handle different possible API response structures
    const templates = Array.isArray(data.templates) ? data.templates :
                     Array.isArray(data.workflows) ? data.workflows :
                     Array.isArray(data.data) ? data.data :
                     Array.isArray(data) ? data : [];

    return {
      templates: templates.map((t: any) => this.transformTemplate(t)),
      total: data.total || data.count || templates.length,
      page: params.page || 1,
      pages: Math.ceil((data.total || templates.length) / (params.limit || 24)),
      limit: params.limit || 24,
    };
  }

  private transformTemplate(data: any): N8NTemplate {
    return {
      id: data.id || data._id || String(data.workflowId),
      name: data.name || data.title || 'Untitled Workflow',
      description: data.description || data.summary || '',
      category: data.category || data.categories?.[0] || 'Other',
      subcategory: data.subcategory || data.categories?.[1],
      tags: Array.isArray(data.tags) ? data.tags : 
            Array.isArray(data.categories) ? data.categories : [],
      nodes: this.extractNodes(data.workflow || data.nodes || data),
      workflow: data.workflow || data,
      createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
      totalViews: data.totalViews || data.views || 0,
      official: Boolean(data.official || data.verified),
      author: {
        name: data.author?.name || data.creator?.name || 'Community',
        avatar: data.author?.avatar || data.creator?.avatar,
      },
    };
  }

  private transformCategories(data: any): N8NCategory[] {
    // Handle different possible category response structures
    const categories = Array.isArray(data.categories) ? data.categories :
                      Array.isArray(data) ? data : [];

    return categories.map((cat: any) => ({
      name: cat.name || cat.title || String(cat),
      count: cat.count || cat.total || 0,
      subcategories: Array.isArray(cat.subcategories) 
        ? cat.subcategories.map((sub: any) => ({
            name: sub.name || sub.title || String(sub),
            count: sub.count || sub.total || 0,
          }))
        : undefined,
    }));
  }

  private extractNodes(workflow: any): Array<{ name: string; type: string; position: [number, number]; parameters?: Record<string, any> }> {
    if (!workflow || typeof workflow !== 'object') {
      return [];
    }

    const nodes = workflow.nodes || [];
    
    return Array.isArray(nodes) ? nodes.map((node: any) => ({
      name: node.name || node.label || 'Unnamed Node',
      type: node.type || node.typeVersion || 'unknown',
      position: Array.isArray(node.position) ? node.position : [0, 0],
      parameters: node.parameters || node.props || node.settings,
    })) : [];
  }
}