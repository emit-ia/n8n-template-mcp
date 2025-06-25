import { N8NService } from './n8n.service.js';
import { N8NClientConfig } from '@/types/index.js';

// Default configuration for N8N service
const defaultConfig: N8NClientConfig = {
  apiBase: process.env.N8N_API_BASE || 'https://api.n8n.io',
  enableGraphQL: process.env.ENABLE_GRAPHQL === 'true',
  graphqlUrl: process.env.N8N_GQL_URL || 'https://workflow-api.n8n.io/graphql',
  cache: {
    ttl: {
      search: parseInt(process.env.CACHE_SEARCH_TTL || '900'), // 15 minutes
      template: parseInt(process.env.CACHE_TEMPLATE_TTL || '3600'), // 1 hour  
      categories: parseInt(process.env.CACHE_CATEGORIES_TTL || '86400'), // 24 hours
    },
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '10'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
  },
};

// Create singleton service instance
export const n8nService = new N8NService(defaultConfig);

// Export service class for testing
export { N8NService };