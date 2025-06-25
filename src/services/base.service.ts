import { N8NApiError } from '@/types/index.js';

export abstract class BaseService {
  protected baseUrl: string;
  protected userAgent: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.userAgent = 'n8n-template-mcp/1.0.0';
  }

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    const defaultOptions: RequestInit = {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, defaultOptions);

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt;
          
          if (attempt < maxRetries) {
            await this.sleep(delay);
            continue;
          }
        }

        // Handle other HTTP errors
        if (!response.ok) {
          throw new N8NApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on client errors (4xx except 429)
        if (error instanceof N8NApiError && error.statusCode && 
            error.statusCode >= 400 && error.statusCode < 500 && 
            error.statusCode !== 429) {
          throw error;
        }

        // Exponential backoff for retries
        if (attempt < maxRetries) {
          await this.sleep(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    throw new N8NApiError(
      `Failed to fetch after ${maxRetries} attempts`,
      undefined,
      lastError || undefined
    );
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(endpoint, this.baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    return url.toString();
  }

  protected async jsonResponse<T>(response: Response): Promise<T> {
    try {
      return await response.json();
    } catch (error) {
      throw new N8NApiError(
        'Failed to parse JSON response',
        response.status,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}