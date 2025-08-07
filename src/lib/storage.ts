// In-memory cache with session storage fallback
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxItems = 100; // Limit cache size
  
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    // Clean up expired items first
    this.cleanupExpired();
    
    // If cache is getting too large, remove oldest items
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    this.cache.set(key, item);
    
    // Log cache operations for debugging
    console.log(`💾 Cached data for key: ${key}, TTL: ${ttlMinutes}min`);
    
    // Try to store in sessionStorage as backup (smaller, more reliable)
    try {
      // Only store essential data in sessionStorage
      const essentialData = this.getEssentialData(data);
      if (essentialData) {
        sessionStorage.setItem(`cache_${key}`, JSON.stringify({
          data: essentialData,
          expiry: item.expiry
        }));
      }
    } catch (error) {
      // SessionStorage failed, but memory cache still works
      console.warn('SessionStorage failed, using memory only:', error);
    }
  }
  
  get<T>(key: string): T | null {
    // Check memory cache first
    const item = this.cache.get(key);
    if (item && Date.now() < item.expiry) {
      console.log(`🎯 Cache hit for key: ${key}`);
      return item.data;
    }
    
    // If not in memory, try sessionStorage
    try {
      const sessionItem = sessionStorage.getItem(`cache_${key}`);
      if (sessionItem) {
        const parsed = JSON.parse(sessionItem);
        if (Date.now() < parsed.expiry) {
          // Restore to memory cache
          this.cache.set(key, {
            data: parsed.data,
            timestamp: Date.now(),
            expiry: parsed.expiry
          });
          console.log(`📱 Restored from sessionStorage: ${key}`);
          return parsed.data;
        } else {
          // Expired, remove it
          sessionStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
    }
    
    // Clean up expired memory cache item
    if (item) {
      this.cache.delete(key);
    }
    
    console.log(`❌ Cache miss for key: ${key}`);
    return null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    try {
      sessionStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to delete from sessionStorage:', error);
    }
  }
  
  clear(): void {
    this.cache.clear();
    try {
      // Clear only our cache items from sessionStorage
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  private getEssentialData(data: any): any {
    // Only store essential fields to reduce storage size
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item && typeof item === 'object') {
          // For player data, only store essential fields
          return {
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            status: item.status,
            looks_rating: item.looks_rating,
            totalMeetings: item.totalMeetings,
            cpn: item.cpn,
            averageRating: item.averageRating,
            bench: item.bench
          };
        }
        return item;
      });
    }
    return data;
  }
  
  // Get cache info for debugging
  getInfo(): { memoryItems: number; sessionItems: number } {
    let sessionItems = 0;
    try {
      const keys = Object.keys(sessionStorage);
      sessionItems = keys.filter(key => key.startsWith('cache_')).length;
    } catch (error) {
      console.warn('Failed to get session storage info:', error);
    }
    
    return { 
      memoryItems: this.cache.size, 
      sessionItems 
    };
  }
}

export const persistentCache = new MemoryCache();

// Hook for using persistent cache with React
export function usePersistentCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 30
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Try to get from cache first
        const cached = persistentCache.get<T>(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
        
        // If not in cache, fetch fresh data
        setLoading(true);
        const freshData = await fetcher();
        persistentCache.set(key, freshData, ttlMinutes);
        setData(freshData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [key, ttlMinutes]);
  
  const refetch = React.useCallback(async () => {
    try {
      setLoading(true);
      const freshData = await fetcher();
      persistentCache.set(key, freshData, ttlMinutes);
      setData(freshData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error refetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [key, ttlMinutes]);
  
  const invalidate = React.useCallback(() => {
    persistentCache.delete(key);
  }, [key]);
  
  return { data, loading, error, refetch, invalidate };
}