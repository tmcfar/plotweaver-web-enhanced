// Enhanced Lock API client with advanced caching, retry logic, and request deduplication
import { ComponentLock, LockConflict, ConflictResolution, BulkLockOperation, ConflictCheck } from './locks';

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  etag?: string;
}

interface RequestCache {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, data: T, ttl?: number, etag?: string): void;
  delete(key: string): void;
  clear(): void;
  isValid(key: string): boolean;
  keys(): IterableIterator<string>;
}

class MemoryCache implements RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (!this.isValid(key)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL, etag?: string): void {
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      ttl,
      etag,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  isValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = new Date().getTime();
    const entryTime = entry.timestamp.getTime();
    return (now - entryTime) < entry.ttl;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  // Get cache statistics
  getStats() {
    const now = new Date().getTime();
    const entries = Array.from(this.cache.values());
    const valid = entries.filter(entry => 
      (now - entry.timestamp.getTime()) < entry.ttl
    ).length;
    
    return {
      total: entries.length,
      valid,
      expired: entries.length - valid,
      hitRate: valid / Math.max(entries.length, 1),
    };
  }
}

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

interface RequestOptions extends RequestInit {
  skipCache?: boolean;
  cacheTTL?: number;
  retryConfig?: Partial<RetryConfig>;
  timeout?: number;
}

class EnhancedLockAPIService {
  private baseUrl: string;
  private cache: RequestCache;
  private pendingRequests = new Map<string, Promise<any>>();
  private abortControllers = new Map<string, AbortController>();
  
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
  };

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.cache = new MemoryCache();
  }

  private generateRequestKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    if (!config.exponentialBackoff) {
      return config.baseDelay;
    }
    
    const delay = config.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      retryConfig = {},
      timeout = 10000,
      skipCache = false,
      cacheTTL,
      ...fetchOptions
    } = options;

    const config = { ...this.defaultRetryConfig, ...retryConfig };
    const requestKey = this.generateRequestKey(endpoint, fetchOptions);
    
    // Check cache for GET requests
    if (fetchOptions.method === 'GET' || !fetchOptions.method) {
      if (!skipCache) {
        const cached = this.cache.get<T>(requestKey);
        if (cached) {
          return cached.data;
        }
      }
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this.executeRequestWithRetry<T>(
      endpoint,
      fetchOptions,
      config,
      timeout,
      requestKey,
      cacheTTL
    );

    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeRequestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    retryConfig: RetryConfig,
    timeout: number,
    requestKey: string,
    cacheTTL?: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      const abortController = new AbortController();
      this.abortControllers.set(requestKey, abortController);

      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeout);

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: abortController.signal,
          ...options,
        });

        clearTimeout(timeoutId);
        this.abortControllers.delete(requestKey);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const etag = response.headers.get('etag');
        const data = await response.json();

        // Cache successful GET requests
        if (!options.method || options.method === 'GET') {
          this.cache.set(requestKey, data, cacheTTL, etag || undefined);
        }

        // Invalidate related cache entries for mutating operations
        if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
          this.invalidateRelatedCache(endpoint);
        }

        return data;
      } catch (error) {
        clearTimeout(timeoutId);
        this.abortControllers.delete(requestKey);
        
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry for certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error('Request timeout');
            break;
          }
          
          // Don't retry client errors (4xx)
          if (error.message.includes('HTTP 4')) {
            break;
          }
        }

        // Wait before retry (except for last attempt)
        if (attempt < retryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, retryConfig);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  private invalidateRelatedCache(endpoint: string): void {
    // Invalidate cache entries related to the endpoint
    const pathParts = endpoint.split('/');
    const patterns = [
      endpoint,
      pathParts.slice(0, -1).join('/'), // Parent path
      `/projects/${pathParts[2]}/locks`, // Project locks
    ];

    patterns.forEach(pattern => {
      Array.from(this.cache.keys()).forEach(key => {
        if (typeof key === 'string' && key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    });
  }

  // Public API methods
  async getLocks(projectId: string, options?: RequestOptions): Promise<Record<string, ComponentLock>> {
    try {
      return await this.requestWithRetry<Record<string, ComponentLock>>(
        `/projects/${projectId}/locks`,
        { ...options, method: 'GET' }
      );
    } catch (error) {
      console.error('Failed to fetch locks:', error);
      throw new Error(`Failed to fetch locks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLock(
    projectId: string,
    componentId: string,
    lock: ComponentLock,
    options?: RequestOptions
  ): Promise<void> {
    try {
      await this.requestWithRetry(
        `/projects/${projectId}/locks/${componentId}`,
        {
          ...options,
          method: 'PUT',
          body: JSON.stringify(lock),
          skipCache: true,
        }
      );
    } catch (error) {
      throw new Error(`Failed to update lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async bulkUpdateLocks(
    projectId: string,
    operations: BulkLockOperation[],
    options?: RequestOptions
  ): Promise<void> {
    try {
      await this.requestWithRetry(
        `/projects/${projectId}/locks/bulk`,
        {
          ...options,
          method: 'POST',
          body: JSON.stringify({ operations }),
          skipCache: true,
          timeout: 15000, // Longer timeout for bulk operations
        }
      );
    } catch (error) {
      throw new Error(`Failed to bulk update locks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkConflicts(
    projectId: string,
    operation: any,
    options?: RequestOptions
  ): Promise<ConflictCheck> {
    try {
      return await this.requestWithRetry<ConflictCheck>(
        `/projects/${projectId}/locks/check-conflicts`,
        {
          ...options,
          method: 'POST',
          body: JSON.stringify(operation),
          skipCache: true,
          cacheTTL: 30000, // Cache for 30 seconds
        }
      );
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        canProceed: true,
      };
    }
  }

  async resolveConflict(
    projectId: string,
    conflictId: string,
    resolution: ConflictResolution,
    options?: RequestOptions
  ): Promise<void> {
    try {
      await this.requestWithRetry(
        `/projects/${projectId}/conflicts/${conflictId}/resolve`,
        {
          ...options,
          method: 'POST',
          body: JSON.stringify(resolution),
          skipCache: true,
        }
      );
    } catch (error) {
      throw new Error(`Failed to resolve conflict: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAuditTrail(projectId: string, options?: RequestOptions): Promise<any[]> {
    try {
      return await this.requestWithRetry<any[]>(
        `/projects/${projectId}/locks/audit`,
        { ...options, method: 'GET' }
      );
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      return [];
    }
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    if (this.cache instanceof MemoryCache) {
      return this.cache.getStats();
    }
    return null;
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific pattern
      Array.from(this.cache.keys()).forEach(key => {
        if (typeof key === 'string' && key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  // Request cancellation
  cancelPendingRequests(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
    this.pendingRequests.clear();
  }

  cancelRequest(endpoint: string, options: RequestInit = {}): void {
    const requestKey = this.generateRequestKey(endpoint, options);
    const controller = this.abortControllers.get(requestKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestKey);
      this.pendingRequests.delete(requestKey);
    }
  }
}

export const enhancedLockAPI = new EnhancedLockAPIService();

// Maintain backward compatibility
export const lockAPI = enhancedLockAPI;