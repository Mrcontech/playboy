/**
 * Lightning-Fast Data Loader Hook
 * 
 * PERFORMANCE TARGETS:
 * - Initial load: <200ms
 * - Cache hits: <10ms
 * - Background updates: Non-blocking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { lightningService } from '../services/lightningService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { PlayerCard, PlayerWithPrecomputedStats, PlayerComplete } from '../services/lightningService';

interface LightningLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  loadTime: number;
  cacheHit: boolean;
}

export function useLightningLoader<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    backgroundRefresh?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const { enabled = true, backgroundRefresh = true, refreshInterval = 5 * 60 * 1000 } = options;
  
  const [state, setState] = useState<LightningLoaderState<T>>({
    data: null,
    loading: true,
    error: null,
    loadTime: 0,
    cacheHit: false
  });
  
  const loadStartTime = useRef<number>(0);
  const refreshTimer = useRef<NodeJS.Timeout>();

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    loadStartTime.current = performance.now();
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const data = await fetcher();
      const loadTime = performance.now() - loadStartTime.current;
      
      setState({
        data,
        loading: false,
        error: null,
        loadTime: Math.round(loadTime),
        cacheHit: loadTime < 50 // Assume cache hit if very fast
      });
      
      console.log(`⚡ Data loaded for ${key} in ${Math.round(loadTime)}ms`);
      
    } catch (error) {
      const loadTime = performance.now() - loadStartTime.current;
      const err = error instanceof Error ? error : new Error(`Failed to load ${key}`);
      
      // Add context for debugging
      console.error(`❌ Error loading ${key}:`, {
        error: err.message,
        supabaseConfigured: isSupabaseConfigured,
        loadTime: Math.round(loadTime)
      });
      
      setState({
        data: null,
        loading: false,
        error: err,
        loadTime: Math.round(loadTime),
        cacheHit: false
      });
    }
  }, [key, fetcher, enabled]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background refresh setup
  useEffect(() => {
    if (backgroundRefresh && refreshInterval > 0) {
      refreshTimer.current = setInterval(() => {
        console.log(`🔄 Background refresh for ${key}`);
        loadData(true);
      }, refreshInterval);
      
      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [backgroundRefresh, refreshInterval, loadData, key]);

  const refetch = useCallback(() => loadData(true), [loadData]);

  return {
    ...state,
    refetch
  };
}

// Specialized hooks for different data types
export function usePlayerCards(forceRefresh = false) {
  return useLightningLoader(
    'player_cards',
    () => lightningService.getPlayerCards(forceRefresh),
    { backgroundRefresh: true, refreshInterval: 10 * 60 * 1000 }
  );
}

export function usePlayersWithStats(forceRefresh = false) {
  return useLightningLoader(
    'players_with_stats',
    () => lightningService.getPlayersWithStats(forceRefresh),
    { backgroundRefresh: true, refreshInterval: 5 * 60 * 1000 }
  );
}

export function useRecentPlayerCards(limit: number = 3, forceRefresh = false) {
  return useLightningLoader(
    `recent_player_cards_${limit}`,
    () => lightningService.getRecentPlayerCards(limit, forceRefresh),
    { backgroundRefresh: true, refreshInterval: 2 * 60 * 1000 }
  );
}

export function usePlayerComplete(playerId: string, enabled = true) {
  return useLightningLoader(
    `player_complete_${playerId}`,
    () => lightningService.getPlayerComplete(playerId),
    { enabled, backgroundRefresh: false } // No background refresh for detailed data
  );
}

// Master optimization hook
export function useLightningOptimization() {
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const runOptimization = async () => {
      try {
        console.log('🚀 Starting lightning optimization...');
        setOptimizationProgress(25);
        
        // Step 1: Warm up critical caches
        await lightningService.warmupCache();
        if (!isMounted) return;
        setOptimizationProgress(75);
        
        // Step 2: Mark optimization complete
        setOptimizationProgress(100);
        setOptimizationComplete(true);
        
        console.log('⚡ Lightning optimization completed');
        
      } catch (error) {
        console.error('❌ Optimization failed:', error);
        setOptimizationComplete(true); // Don't block UI on error
      }
    };
    
    // Start optimization after a brief delay
    const timer = setTimeout(runOptimization, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return {
    optimizationComplete,
    optimizationProgress,
    performanceStats: lightningService.getPerformanceStats()
  };
}