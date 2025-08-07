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
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // If not in cache or cache disabled, fetch fresh data
      setLoading(true);
      setError(null);
      
      const freshData = await fetcher();
      
      // Store in persistent cache
      persistentCache.set(key, freshData, ttlMinutes);
      setData(freshData);
      setLoading(false);
      
      return freshData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      console.error(`Error loading data for key ${key}:`, err);
      throw error;
    }
  }, [key, fetcher, ttlMinutes, enabled]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
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
  // Check if already cached
  const cached = persistentCache.get<T>(key);
  if (cached) return Promise.resolve(cached);

  // Fetch and cache in background
  return fetcher().then(data => {
    persistentCache.set(key, data, ttlMinutes);
    return data;
  }).catch(error => {
    console.error(`Error preloading data for key ${key}:`, error);
    throw error;
  });
}