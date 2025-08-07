import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedPlayerService } from '../services/optimizedPlayerService';
import type { PlayerMinimal, PlayerComplete } from '../services/optimizedPlayerService';

// Enhanced data loader with performance monitoring
export function useOptimizedPlayerLoader() {
  const [minimalPlayers, setMinimalPlayers] = useState<PlayerMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const loadStartTime = useRef<number>(0);

  // TIER 1: Load minimal data immediately
  const loadMinimalData = useCallback(async (forceRefresh = false) => {
    loadStartTime.current = performance.now();
    console.log('🚀 TIER 1: Starting minimal data load...');
    
    try {
      setLoading(true);
      setError(null);
      
      const players = await optimizedPlayerService.getPlayersMinimal(forceRefresh);
      setMinimalPlayers(players);
      
      const loadTime = performance.now() - loadStartTime.current;
      console.log(`⚡ TIER 1: Minimal data loaded in ${Math.round(loadTime)}ms`);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load players');
      console.error('❌ TIER 1: Error loading minimal data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // TIER 2: Background preload complete data
  const startBackgroundPreload = useCallback(async () => {
    console.log('🔄 TIER 2: Starting background preload...');
    setBackgroundLoading(true);
    
    try {
      await optimizedPlayerService.preloadAllCompleteData();
      console.log('🎉 TIER 2: Background preload completed');
    } catch (error) {
      console.warn('⚠️ TIER 2: Background preload failed:', error);
    } finally {
      setBackgroundLoading(false);
    }
  }, []);

  // Load complete player data on demand
  const getPlayerComplete = useCallback(async (playerId: string): Promise<PlayerComplete> => {
    console.log('🔍 TIER 2: Loading complete data for player:', playerId);
    return await optimizedPlayerService.getPlayerComplete(playerId);
  }, []);

  // Initialize data loading
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      // TIER 1: Load minimal data immediately
      await loadMinimalData();
      
      // TIER 2: Start background preload after minimal data is loaded
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) {
            startBackgroundPreload();
          }
        }, 100); // Small delay to ensure UI is responsive
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, [loadMinimalData, startBackgroundPreload]);

  // Separate active and bench players
  const activePlayers = useMemo(() => 
    minimalPlayers.filter(player => !player.bench), [minimalPlayers]);
  
  const benchPlayers = useMemo(() => 
    minimalPlayers.filter(player => player.bench), [minimalPlayers]);

  // Recent players for hub
  const recentPlayers = useMemo(() => 
    activePlayers.slice(0, 3), [activePlayers]);

  return {
    // TIER 1 data
    minimalPlayers,
    activePlayers,
    benchPlayers,
    recentPlayers,
    loading,
    error,
    
    // TIER 2 functions
    getPlayerComplete,
    backgroundLoading,
    
    // Utility functions
    refresh: () => loadMinimalData(true),
    getCacheStats: optimizedPlayerService.getCacheStats,
    clearCache: optimizedPlayerService.clearCache
  };
}