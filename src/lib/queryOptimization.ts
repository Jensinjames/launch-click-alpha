import { QueryClient } from '@tanstack/react-query';

// Query deduplication helper
class QueryDeduplicator {
  private pendingQueries = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    if (this.pendingQueries.has(key)) {
      return this.pendingQueries.get(key)!;
    }

    const promise = queryFn().finally(() => {
      this.pendingQueries.delete(key);
    });

    this.pendingQueries.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingQueries.clear();
  }
}

export const queryDeduplicator = new QueryDeduplicator();

// Batch request helper
interface BatchRequest {
  id: string;
  queryFn: () => Promise<any>;
}

class BatchProcessor {
  private batchQueue: BatchRequest[] = [];
  private processing = false;
  private batchTimeout: NodeJS.Timeout | null = null;

  addToBatch(request: BatchRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        ...request,
        resolve,
        reject,
      } as any);

      this.scheduleBatch();
    });
  }

  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, 10); // 10ms batch window
  }

  private async processBatch() {
    if (this.processing || this.batchQueue.length === 0) {
      return;
    }

    this.processing = true;
    const currentBatch = [...this.batchQueue];
    this.batchQueue.length = 0;

    try {
      // Execute all queries in parallel
      const results = await Promise.allSettled(
        currentBatch.map(request => request.queryFn())
      );

      // Resolve/reject each request based on its result
      results.forEach((result, index) => {
        const request = currentBatch[index] as any;
        if (result.status === 'fulfilled') {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
      });
    } catch (error) {
      // Fallback: reject all if batch processing fails
      currentBatch.forEach((request: any) => {
        request.reject(error);
      });
    } finally {
      this.processing = false;
    }
  }
}

export const batchProcessor = new BatchProcessor();

// Intelligent cache warming
export const cacheWarming = {
  // Warm critical queries based on user behavior
  warmUserDashboard: async (queryClient: QueryClient, userId: string) => {
    const criticalQueries = [
      { key: ['user', 'credits', userId], priority: 1 },
      { key: ['user', 'plans', userId], priority: 2 },
      { key: ['content', 'recent', userId], priority: 3 },
    ];

    // Execute high priority queries first
    for (const query of criticalQueries.sort((a, b) => a.priority - b.priority)) {
      if (!queryClient.getQueryData(query.key)) {
        // Only warm if not already cached
        queryClient.prefetchQuery({ queryKey: query.key });
      }
    }
  },

  // Progressive cache warming based on route
  warmRoute: async (queryClient: QueryClient, route: string, userId: string) => {
    const routeQueries: Record<string, string[]> = {
      '/teams': ['teams-list', 'teams-invitations'],
      '/analytics': ['analytics-dashboard', 'content-performance'],
      '/content': ['content-list', 'content-templates'],
    };

    const queries = routeQueries[route];
    if (queries) {
      queries.forEach(queryType => {
        const queryKey = [queryType, userId];
        if (!queryClient.getQueryData(queryKey)) {
          queryClient.prefetchQuery({ queryKey });
        }
      });
    }
  }
};

// Memory optimization helpers
export const memoryOptimization = {
  // Clear stale cache entries
  clearStaleCache: (queryClient: QueryClient, maxAge = 30 * 60 * 1000) => { // 30 minutes
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();

    queries.forEach(query => {
      const lastFetch = query.state.dataUpdatedAt;
      if (lastFetch && (now - lastFetch) > maxAge) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  },

  // Optimize cache size
  optimizeCacheSize: (queryClient: QueryClient, maxQueries = 100) => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    if (queries.length > maxQueries) {
      // Remove oldest queries first
      queries
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
        .slice(0, queries.length - maxQueries)
        .forEach(query => {
          queryClient.removeQueries({ queryKey: query.queryKey });
        });
    }
  }
};

// Performance monitoring
export const performanceMonitor = {
  measureQueryTime: <T>(queryFn: () => Promise<T>, queryKey: string): Promise<T & { __queryTime: number }> => {
    const start = performance.now();
    return queryFn().then(result => {
      const duration = performance.now() - start;
      
      if (import.meta.env.DEV && duration > 1000) {
        console.warn(`Slow query detected: ${queryKey} took ${duration.toFixed(2)}ms`);
      }
      
      return {
        ...result,
        __queryTime: duration
      } as T & { __queryTime: number };
    });
  },

  trackCacheHitRate: (queryClient: QueryClient) => {
    if (!import.meta.env.DEV) return;
    
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = queries.reduce((acc, query) => {
      acc.total++;
      if (query.state.data && query.state.fetchStatus !== 'fetching') {
        acc.hits++;
      }
      return acc;
    }, { hits: 0, total: 0 });

    const hitRate = stats.total > 0 ? (stats.hits / stats.total) * 100 : 0;
    console.log(`Query cache hit rate: ${hitRate.toFixed(1)}% (${stats.hits}/${stats.total})`);
  }
};