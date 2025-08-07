import { useState, useEffect, useCallback } from 'react';
import { persistentCache } from '../lib/storage';
import { playerApi, statsApi, datesApi } from '../services/api';
import { playerService } from '../services/playerService';

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

  // Force refresh function that clears cache and reloads
  const forceRefresh = useCallback(() => {
    console.log(`Force refreshing data for key: ${key}`);
    persistentCache.delete(key);
    return loadData(false);
  }, [key, loadData]);

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
    updateCache,
    forceRefresh
  };
}

// Enhanced preloader hook for route-based optimization
export function usePreloader() {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedRoutes, setPreloadedRoutes] = useState<Set<string>>(new Set());

  const preloadForRoute = useCallback(async (route: string) => {
    if (preloadedRoutes.has(route)) {
      console.log(`📋 Route ${route} already preloaded, skipping`);
      return;
    }

    setIsPreloading(true);
    console.log(`🔄 Preloading data for route: ${route}`);
    
    try {
      const startTime = performance.now();
      
      switch (route) {
        case 'hub':
          await Promise.all([
            preloadData('getRecentPlayersBasic_3', () => playerService.getRecentPlayersBasic(3), 15),
            preloadData('getUpcomingDates', () => datesApi.getUpcomingDates(), 10),
            // Background preload full playbook data
            preloadData('getDashboardStats', () => statsApi.getDashboardStats(), 30),
            preloadData('getCPNByPeriod_monthly', () => statsApi.getCPNByPeriod('monthly'), 30),
            preloadData('getTopPlayersByRating_3', () => statsApi.getTopPlayersByRating(3), 30),
          ]);
          break;
          
        case 'roster':
          await Promise.all([
            preloadData('getActivePlayers', () => playerService.getActivePlayers(), 30),
            preloadData('getBenchPlayers', () => playerService.getBenchPlayers(), 30),
            // Background preload full roster details for instant profile access
            preloadData('getAllPlayersDetailed', () => this.preloadAllPlayersDetailed(), 45),
          ]);
          break;
          
        case 'playbook':
          // Playbook data should already be preloaded from hub, just verify cache
          await Promise.all([
            preloadData('getDashboardStats', () => statsApi.getDashboardStats(), 15),
            preloadData('getCPNByPeriod_monthly', () => statsApi.getCPNByPeriod('monthly'), 30),
            preloadData('getTopPlayersByRating_3', () => statsApi.getTopPlayersByRating(3), 30),
          ]);
          break;
          
        case 'settings':
          // Settings doesn't need data preloading
          break;
      }
      
      setPreloadedRoutes(prev => new Set([...prev, route]));
      
      const endTime = performance.now();
      console.log(`✅ Route ${route} preloaded in ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      console.warn(`⚠️ Error preloading route ${route}:`, error);
    } finally {
      setIsPreloading(false);
    }
  }, [preloadedRoutes]);

  // Background preload all detailed player data
  const preloadAllPlayersDetailed = useCallback(async () => {
    console.log('🔄 Background preloading all detailed player data...');
    
    try {
      // Get basic players first
      const basicPlayers = await playerService.getPlayersBasic();
      
      // Preload detailed data for each player in background
      const detailedPromises = basicPlayers.map(async (player) => {
        try {
          return await playerService.getPlayerDetailed(player.id, false);
        } catch (error) {
          console.warn(`Failed to preload player ${player.name}:`, error);
          return null;
        }
      });
      
      const detailedPlayers = await Promise.all(detailedPromises);
      const validPlayers = detailedPlayers.filter(p => p !== null);
      
      console.log(`✅ Background preloaded ${validPlayers.length} detailed players`);
      return validPlayers;
    } catch (error) {
      console.warn('⚠️ Error in background preloading:', error);
      return [];
    }
  }, []);
  return {
    preloadForRoute,
    isPreloading,
    preloadedRoutes: Array.from(preloadedRoutes),
    preloadAllPlayersDetailed
  };
}

// Preload data function for critical paths
export function preloadData<T>(key: string, fetcher: () => Promise<T>, ttlMinutes = 30): Promise<T | null> {
  console.log(`📦 Preloading data for key: ${key}`);
  
  // Check if already cached
  const cached = persistentCache.get<T>(key);
  if (cached) {
    console.log(`💾 Data already cached for key: ${key}`);
    return Promise.resolve(cached);
  }

  // Fetch and cache in background
  console.log(`🌐 Fetching fresh data for key: ${key}`);
  const startTime = performance.now();
  
  return fetcher().then(data => {
    const endTime = performance.now();
    console.log(`✅ Successfully preloaded data for key: ${key} in ${Math.round(endTime - startTime)}ms`);
    persistentCache.set(key, data, ttlMinutes);
    return data;
  }).catch(error => {
    console.warn(`❌ Error preloading data for key ${key}:`, error.message);
    // Return null instead of throwing to prevent app crash
    return null;
  });
}