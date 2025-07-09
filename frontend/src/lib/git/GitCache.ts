interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

export class GitCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats;

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize
    };
  }

  private generateKey(projectId: string, operation: string, ...params: any[]): string {
    return `${projectId}:${operation}:${JSON.stringify(params)}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  private evictOldest(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  get<T>(projectId: string, operation: string, ...params: any[]): T | null {
    const key = this.generateKey(projectId, operation, ...params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }
    
    this.stats.hits++;
    return entry.data;
  }

  set<T>(projectId: string, operation: string, data: T, ttl?: number, ...params: any[]): void {
    const key = this.generateKey(projectId, operation, ...params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    // Evict expired entries first
    this.evictExpired();
    
    // If we're at max size, evict oldest
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  invalidate(projectId: string, operation?: string, ...params: any[]): void {
    if (!operation) {
      // Invalidate all entries for this project
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${projectId}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      // Invalidate specific operation
      const key = this.generateKey(projectId, operation, ...params);
      this.cache.delete(key);
    }
    this.stats.size = this.cache.size;
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Predefined cache TTL configurations
  static readonly TTL = {
    FILE_CONTENT: 3 * 60 * 1000,     // 3 minutes
    DIRECTORY_TREE: 5 * 60 * 1000,   // 5 minutes
    FILE_HISTORY: 10 * 60 * 1000,    // 10 minutes
    REPOSITORY_STATUS: 30 * 1000,    // 30 seconds
    BRANCHES: 2 * 60 * 1000,         // 2 minutes
    DIFF: 5 * 60 * 1000,             // 5 minutes
  };
}

// Global cache instance
export const gitCache = new GitCache();

export default GitCache;