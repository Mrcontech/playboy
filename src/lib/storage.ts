import React from 'react';

// Persistent storage utility with expiration
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class PersistentCache {
  private prefix = 'playboi_cache_';
  
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    };
    
    try {
      // Check available storage space
      const serialized = JSON.stringify(item);
      const currentSize = this.getStorageSize();
      const itemSize = new Blob([serialized]).size;
      
      // If item is too large or would exceed quota, don't cache it
      if (itemSize > 1024 * 1024 || currentSize + itemSize > 4 * 1024 * 1024) {
        console.warn(`Item too large to cache: ${key} (${Math.round(itemSize / 1024)}KB)`);
        return;
      }
      
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      // Try to free up space by clearing old cache
      this.clearOldCache();
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(item));
      } catch (retryError) {
        console.warn('Failed to save to localStorage after cleanup:', retryError);
        // Don't throw error, just continue without caching
      }
    }
  }
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const parsed: CacheItem<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > parsed.expiry) {
        this.delete(key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      this.delete(key);
      return null;
    }
  }
  
  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }
  }

  private getStorageSize(): number {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  private clearOldCache(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    // Remove oldest 50% of cache items
    const itemsToRemove = Math.ceil(keys.length / 2);
    keys.slice(0, itemsToRemove).forEach(key => localStorage.removeItem(key));
  }
  
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
  
  clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed: CacheItem<any> = JSON.parse(item);
              if (now > parsed.expiry) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired items:', error);
    }
  }
  
  // Get cache info for debugging
  getInfo(): { totalItems: number; totalSize: number } {
    let totalItems = 0;
    let totalSize = 0;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          totalItems++;
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += item.length;
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache info:', error);
    }
    
    return { totalItems, totalSize };
  }
}

export const persistentCache = new PersistentCache();

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