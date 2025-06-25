import QuickLRU from 'quick-lru';
import { CacheConfig, N8NCacheError } from '@/types/index.js';

export class N8NCache {
  private searchCache: QuickLRU<string, any>;
  private templateCache: QuickLRU<string, any>;
  private categoriesCache: QuickLRU<string, any>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Create separate caches with different TTLs
    this.searchCache = new QuickLRU({
      maxSize: Math.floor(config.maxSize * 0.5), // 50% for searches
      maxAge: config.ttl.search * 1000, // Convert to milliseconds
    });
    
    this.templateCache = new QuickLRU({
      maxSize: Math.floor(config.maxSize * 0.4), // 40% for templates
      maxAge: config.ttl.template * 1000,
    });
    
    this.categoriesCache = new QuickLRU({
      maxSize: Math.floor(config.maxSize * 0.1), // 10% for categories
      maxAge: config.ttl.categories * 1000,
    });
  }

  // Search cache methods
  getSearch(key: string): any | undefined {
    return this.searchCache.get(key);
  }

  setSearch(key: string, value: any): void {
    this.searchCache.set(key, value);
  }

  // Template cache methods
  getTemplate(id: string): any | undefined {
    return this.templateCache.get(id);
  }

  setTemplate(id: string, template: any): void {
    this.templateCache.set(id, template);
  }

  // Categories cache methods
  getCategories(): any | undefined {
    return this.categoriesCache.get('categories');
  }

  setCategories(categories: any): void {
    this.categoriesCache.set('categories', categories);
  }

  // Utility methods
  clear(): void {
    this.searchCache.clear();
    this.templateCache.clear();
    this.categoriesCache.clear();
  }

  getStats() {
    return {
      search: {
        size: this.searchCache.size,
        maxSize: this.searchCache.maxSize,
      },
      template: {
        size: this.templateCache.size,
        maxSize: this.templateCache.maxSize,
      },
      categories: {
        size: this.categoriesCache.size,
        maxSize: this.categoriesCache.maxSize,
      },
    };
  }

  // Generic cached operation
  async cached<T>(
    cacheType: 'search' | 'template' | 'categories',
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    try {
      // Try to get from cache first
      let cached: T | undefined;
      
      switch (cacheType) {
        case 'search':
          cached = this.getSearch(key);
          break;
        case 'template':
          cached = this.getTemplate(key);
          break;
        case 'categories':
          cached = this.getCategories();
          break;
      }

      if (cached !== undefined) {
        return cached;
      }

      // Cache miss - fetch from factory
      const result = await factory();

      // Store in appropriate cache
      switch (cacheType) {
        case 'search':
          this.setSearch(key, result);
          break;
        case 'template':
          this.setTemplate(key, result);
          break;
        case 'categories':
          this.setCategories(result);
          break;
      }

      return result;
    } catch (error) {
      throw new N8NCacheError(
        `Cache operation failed for ${cacheType}:${key}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}