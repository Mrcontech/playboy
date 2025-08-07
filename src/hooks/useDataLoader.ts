import { useState, useEffect, useCallback } from 'react';
import { persistentCache } from '../lib/storage';

interface UseDataLoaderOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttlMinutes?: number;
  dependencies?: any[];
  enabled?: boolean;
}

export function useDataLoader<T>({
  key,
  fetcher,
  ttlMinutes = 30,
  dependencies = [],
  enabled = true
}: UseDataLoaderOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async (useCache = true) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      // Try to get from persistent cache first
      if (useCache) {
        const cached = persistentCache.get<T>(key);
        if (cached) {
          console.log(`Cache hit for key: ${key}`);
          setData(cached);
          setLoading(false);
          return cached;
        }
        console.log(`Cache miss for key: ${key}`);
      }

      // If not in cache or cache disabled, fetch fresh data
      setLoading(true);
      setError(null);
      console.log(`Fetching fresh data for key: ${key}`);
      
      const freshData = await fetcher();
      
      if (!freshData) {
        console.warn(`Fetcher returned null/undefined for key: ${key}`);
        setData(null);
        setLoading(false);
        return null;
      }
      
      // Store in persistent cache only if TTL > 0
      if (ttlMinutes > 0) {
        persistentCache.set(key, freshData, ttlMinutes);
      }
      setData(freshData);
      console.log(`Successfully loaded data for key: ${key}`);
      setLoading(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`Error loading data for key ${key}:`, error);
      
      // Check if we have cached data to fall back to
      const cachedFallback = persistentCache.get<T>(key);
      if (cachedFallback) {
        console.log(`Using cached fallback data for key: ${key}`);
        setData(cachedFallback);
        setError(null);
      } else {
        console.log(`No cached fallback available for key: ${key}`);
        // Don't set error state for network issues, just show empty state
        setError(null);
        setData(null);
      }
      
      setLoading(false);
      return cachedFallback;
    }
  }, [key, fetcher, ttlMinutes, enabled]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      loadData();
    }, 10);
    
    return () => clearTimeout(timer);
  }, [loadData, ...dependencies]);

  // Refetch function that bypasses cache
  const refetch = useCallback(() => {
    return loadData(false);
  }, [loadData]);

  // Invalidate cache function
  const invalidate = useCallback(() => {
    console.log(`Invalidating cache for key: ${key}`);
    persistentCache.delete(key);
  }, [key]);

  // Update cache function
  const updateCache = useCallback((newData: T) => {
    console.log(`Updating cache for key: ${key}`);
    persistentCache.set(key, newData, ttlMinutes);
    setData(newData);
  }, [key, ttlMinutes]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    updateCache
  };
}

// Preload data function for critical paths
export function preloadData<T>(key: string, fetcher: () => Promise<T>, ttlMinutes = 30) {
  console.log(`Preloading data for key: ${key}`);
  
  // Check if already cached
  const cached = persistentCache.get<T>(key);
  if (cached) {
    console.log(`Data already cached for key: ${key}`);
    return Promise.resolve(cached);
  }

  // Fetch and cache in background
  console.log(`Fetching fresh data for key: ${key}`);
  return fetcher().then(data => {
    console.log(`Successfully preloaded data for key: ${key}`);
    persistentCache.set(key, data, ttlMinutes);
    return data;
  }).catch(error => {
    console.warn(`Error preloading data for key ${key}:`, error.message);
    // Return null instead of throwing to prevent app crash
    return null;
  });
}