import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;

// Simple in-memory cache that persists across component unmounts
class SimpleRosterCache {
  private static instance: SimpleRosterCache;
  private players: Player[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SimpleRosterCache {
    if (!SimpleRosterCache.instance) {
      SimpleRosterCache.instance = new SimpleRosterCache();
    }
    return SimpleRosterCache.instance;
  }

  isValid(): boolean {
    return this.players !== null && (Date.now() - this.lastFetch) < this.CACHE_DURATION;
  }

  get(): Player[] | null {
    if (this.isValid()) {
      console.log('📦 Using cached roster data');
      return this.players;
    }
    return null;
  }

  set(players: Player[]): void {
    this.players = players;
    this.lastFetch = Date.now();
    console.log('💾 Cached roster data:', players.length, 'players');
  }

  invalidate(): void {
    this.players = null;
    this.lastFetch = 0;
    console.log('🗑️ Roster cache invalidated');
  }
}

const rosterCache = SimpleRosterCache.getInstance();

export function useRosterCache() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const loadPlayers = async (forceRefresh = false) => {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = rosterCache.get();
        if (cached) {
          setPlayers(cached);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading roster from database...');
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      if (isMounted.current) {
        const playersData = data || [];
        setPlayers(playersData);
        rosterCache.set(playersData);
        console.log('✅ Roster loaded:', playersData.length, 'players');
      }
    } catch (err) {
      console.error('❌ Error loading roster:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load roster');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    loadPlayers();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = () => loadPlayers(true);
  
  const invalidateCache = () => {
    rosterCache.invalidate();
  };

  return {
    players,
    loading,
    error,
    refresh,
    invalidateCache
  };
}