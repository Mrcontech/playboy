/**
 * Fast Player Service - Two-Tier Loading
 * 
 * TIER 1: Essential data only (name, image, status) - loads in <200ms
 * TIER 2: Full stats and details - loads in background
 */

import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;

// TIER 1: Minimal data for instant display
export interface PlayerBasic {
  id: string;
  name: string;
  image_url?: string;
  status?: string;
  bench?: boolean;
}

// TIER 2: Full player data with stats
export interface PlayerWithStats extends PlayerBasic {
  looks_rating?: number;
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Calculated stats
  totalMeetings: number;
  totalSpent: number;
  averageRating: number;
  cpn: number;
}

// Simple in-memory cache
class PersistentPlayerCache {
  private static instance: PersistentPlayerCache;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes for better persistence

  static getInstance(): PersistentPlayerCache {
    if (!PersistentPlayerCache.instance) {
      PersistentPlayerCache.instance = new PersistentPlayerCache();
    }
    return PersistentPlayerCache.instance;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 Cached data for key: ${key} (${this.cache.size} items in cache)`);
    
    // Also store in sessionStorage for persistence across page reloads
    try {
      sessionStorage.setItem(`player_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store in sessionStorage:', error);
    }
  }

  get(key: string): any | null {
    // Check memory cache first
    const memoryItem = this.cache.get(key);
    if (memoryItem && Date.now() - memoryItem.timestamp < this.CACHE_TTL) {
      console.log(`⚡ Memory cache hit for key: ${key}`);
      return memoryItem.data;
    }

    // Check sessionStorage if not in memory
    try {
      const sessionItem = sessionStorage.getItem(`player_cache_${key}`);
      if (sessionItem) {
        const parsed = JSON.parse(sessionItem);
        if (Date.now() - parsed.timestamp < this.CACHE_TTL) {
          // Restore to memory cache
          this.cache.set(key, parsed);
          console.log(`📱 Session cache hit for key: ${key}`);
          return parsed.data;
        } else {
          // Expired, remove it
          sessionStorage.removeItem(`player_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
    }

    console.log(`❌ Cache miss for key: ${key}`);
    return null;
  }

  clear(): void {
    this.cache.clear();
    // Clear sessionStorage items
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('player_cache_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }
    console.log('🧹 Player cache cleared completely');
  }

  getInfo(): { memoryItems: number; sessionItems: number } {
    let sessionItems = 0;
    try {
      const keys = Object.keys(sessionStorage);
      sessionItems = keys.filter(key => key.startsWith('player_cache_')).length;
    } catch (error) {
      console.warn('Failed to get session storage info:', error);
    }
    
    return { 
      memoryItems: this.cache.size, 
      sessionItems 
    };
  }
}


const playerCache = PersistentPlayerCache.getInstance();

export const fastPlayerService = {
  /**
   * TIER 1: Get minimal player data for instant roster display
   */
  async getPlayersBasic(): Promise<PlayerBasic[]> {
    const cacheKey = 'players_basic';
    const cached = playerCache.get(cacheKey);
    if (cached) {
      console.log('⚡ Using cached basic players');
      return cached;
    }

    console.log('🚀 Loading basic player data (fast)...');
    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, image_url, status, bench')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const players = data || [];
    playerCache.set(cacheKey, players);
    
    const loadTime = performance.now() - startTime;
    console.log(`⚡ Basic players loaded in ${Math.round(loadTime)}ms`);
    
    return players;
  },

  /**
   * TIER 2: Get full player data with calculated stats
   */
  async getPlayerWithStats(playerId: string): Promise<PlayerWithStats> {
    const cacheKey = `player_stats_${playerId}`;
    const cached = playerCache.get(cacheKey);
    if (cached) {
      console.log('⚡ Using cached player stats for:', cached.name);
      return cached;
    }

    console.log('🔍 Loading full player data with stats...');
    
    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (playerError) throw playerError;
    
    // Get meetings for stats calculation
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('amount_spent, rating, performance_rating')
      .eq('profile_id', playerId);
    
    if (meetingsError) throw meetingsError;
    
    // Calculate stats
    const playerMeetings = meetings || [];
    const totalSpent = playerMeetings.reduce((sum, m) => sum + (Number(m.amount_spent) || 0), 0);
    const totalMeetings = playerMeetings.length;
    const ratingsSum = playerMeetings.reduce((sum, m) => sum + (Number(m.rating) || 0), 0);
    const averageRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
    const hookups = playerMeetings.filter(m => m.performance_rating && Number(m.performance_rating) > 0).length;
    const cpn = hookups > 0 ? totalSpent / hookups : 0;
    
    const playerWithStats: PlayerWithStats = {
      ...player,
      totalMeetings,
      totalSpent: Math.round(totalSpent),
      averageRating: Number(averageRating.toFixed(1)),
      cpn: Math.round(cpn)
    };
    
    playerCache.set(cacheKey, playerWithStats);
    console.log('✅ Player stats loaded for:', player.name);
    
    return playerWithStats;
  },

  /**
   * Get active players (basic data only)
   */
  async getActivePlayersBasic(): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic();
    return players.filter(p => !p.bench);
  },

  /**
   * Get bench players (basic data only)
   */
  async getBenchPlayersBasic(): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic();
    return players.filter(p => p.bench);
  },

  /**
   * Get recent players for hub (basic data only)
   */
  async getRecentPlayersBasic(limit: number = 3): Promise<PlayerBasic[]> {
    const cacheKey = `recent_basic_${limit}`;
    const cached = playerCache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, image_url, status, bench')
      .eq('bench', false)
      .limit(limit)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    const players = data || [];
    playerCache.set(cacheKey, players);
    
    return players;
  },

  /**
   * Clear cache
   */
  clearCache() {
    playerCache.clear();
    console.log('🧹 Fast player cache cleared');
  }
};