import { z } from 'zod';

// N8N API Response Types
export interface N8NTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  nodes: NodeInfo[];
  workflow: object;
  createdAt: string;
  updatedAt: string;
  totalViews: number;
  official: boolean;
  author: {
    name: string;
    avatar?: string;
  };
}

export interface NodeInfo {
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
}

export interface N8NCategory {
  name: string;
  count: number;
  subcategories?: Array<{
    name: string;
    count: number;
  }>;
}

export interface SearchResult {
  templates: N8NTemplate[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ExportResult {
  version: string;
  workflows: object[];
  exportedAt: string;
  metadata: {
    templateCount: number;
    nodeTypes: string[];
  };
}

// Search Parameters
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  tags?: string[];
  nodeTypes?: string[];
  official?: boolean;
}

// Cache Configuration
export interface CacheConfig {
  ttl: {
    search: number;
    template: number;
    categories: number;
  };
  maxSize: number;
}

// API Client Configuration
export interface N8NClientConfig {
  apiBase: string;
  enableGraphQL?: boolean;
  graphqlUrl?: string;
  cache: CacheConfig;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

// Zod Schemas for MCP Tool Validation
export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(20).optional().default(10), // Reduced from 24 to 10, max 20
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  nodeTypes: z.array(z.string()).optional(),
  official: z.boolean().optional(),
});

export const TemplateIdSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
});

export const ExportParamsSchema = z.object({
  templateIds: z.array(z.string().min(1)).min(1, 'At least one template ID is required'),
  format: z.enum(['n8n', 'json']).optional().default('n8n'),
});

export const NodeTypeSchema = z.object({
  nodeType: z.string().min(1, 'Node type is required'),
});

// Error Types
export class N8NApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'N8NApiError';
  }
}

export class N8NCacheError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'N8NCacheError';
  }
}

// Optimized response types for reduced context
export interface OptimizedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  nodeCount: number;
  mainNodes: string[];
  official: boolean;
  author: string;
  totalViews: number;
}

export interface OptimizedNodeSearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodeCount: number;
  targetNodeUsage: number;
  otherNodes: string[];
  official: boolean;
  author: string;
  totalViews: number;
}

export interface OptimizedSearchResult {
  templates: OptimizedTemplate[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// Tool Response Types
export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type SearchToolResponse = ToolResponse<OptimizedSearchResult>;
export type TemplateToolResponse = ToolResponse<N8NTemplate>;
export type CategoriesToolResponse = ToolResponse<N8NCategory[]>;
export type ExportToolResponse = ToolResponse<ExportResult>;
export type NodeSearchToolResponse = ToolResponse<OptimizedNodeSearchTemplate[]>;