/**
 * Fast Player Service - Two-Tier Loading
 * 
 * TIER 1: Essential data only (name, image, status) - loads in <200ms
 * TIER 2: Full stats and details - loads in background
 */

import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;

interface Meeting {
  amount_spent: number | null;
  rating: number | null;
  performance_rating: number | null;
}

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
  dateExperienceRating: number;
  performanceRating: number;
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

  // Get all cache keys
  getKeys(): string[] {
    return Array.from(this.cache.keys());
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

  remove(key: string): void {
    this.cache.delete(key);
    try {
      sessionStorage.removeItem(`player_cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error);
    }
    console.log(`🗑️ Removed from cache: ${key}`);
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
  async getPlayersBasic(forceRefresh: boolean = false): Promise<PlayerBasic[]> {
    const cacheKey = 'players_basic';
    const cached = !forceRefresh && playerCache.get(cacheKey);
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
  async getPlayerWithStats(playerId: string, forceRefresh: boolean = false): Promise<PlayerWithStats> {
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      // First, get the latest meeting stats to determine cache key
      const meetingQuery = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', playerId);

      if (meetingQuery.error) {
        console.error('❌ Error getting meeting count:', meetingQuery.error);
        throw new Error(`Failed to get meeting count: ${meetingQuery.error.message}`);
      }

      // Cache key includes player ID and meeting count to detect when meetings change
      const meetingCount = meetingQuery.count ?? 0;
      const cacheKey = `player_stats_${playerId}_meetings_${meetingCount}`;

      // Only use cache if not forcing refresh
      const cached = !forceRefresh && playerCache.get(cacheKey);
      if (cached) {
        console.log(`⚡ Using cached player stats for: ${cached.name} (${meetingCount} meetings)`);
        return cached;
      }

      console.log('🔍 Loading full player data with stats...');

      // Get player data and meetings
      const [profileResult, meetingsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', playerId)
          .single(),
        supabase
          .from('meetings')
          .select('amount_spent, rating, performance_rating')
          .eq('profile_id', playerId)
      ]);

      if (profileResult.error) {
        console.error('❌ Error loading player profile:', profileResult.error);
        throw new Error(`Failed to load player profile: ${profileResult.error.message}`);
      }

      if (meetingsResult.error) {
        console.error('❌ Error loading meetings:', meetingsResult.error);
        throw new Error(`Failed to load player meetings: ${meetingsResult.error.message}`);
      }

      if (!profileResult.data) {
        console.error('❌ Player not found:', playerId);
        throw new Error(`Player not found: ${playerId}`);
      }

      const player: Player = profileResult.data;
      const playerMeetings: Meeting[] = meetingsResult.data || [];

      // Calculate basic stats
      const totalSpent = playerMeetings.reduce((sum: number, m: Meeting) => 
        sum + (Number(m.amount_spent) || 0), 0);
      const totalMeetings = playerMeetings.length;

      // Calculate date experience rating using regular rating
      const dateRatings = playerMeetings.filter((m: Meeting) => 
        m.rating && Number(m.rating) > 0);
      const dateRatingSum = dateRatings.reduce((sum: number, m: Meeting) => 
        sum + Number(m.rating), 0);
      const dateExperienceRating = dateRatings.length > 0 ? 
        dateRatingSum / dateRatings.length : 0;

      // Calculate performance rating
      const performanceRatings = playerMeetings.filter((m: Meeting) => 
        m.performance_rating && Number(m.performance_rating) > 0);
      const performanceRatingSum = performanceRatings.reduce((sum: number, m: Meeting) => 
        sum + Number(m.performance_rating), 0);
      const performanceRating = performanceRatings.length > 0 ? 
        performanceRatingSum / performanceRatings.length : 0;

      // Calculate average rating for overall experience
      const ratingsSum = playerMeetings.reduce((sum: number, m: Meeting) => 
        sum + (Number(m.rating) || 0), 0);
      const averageRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
      
      // Calculate cost per night
      const hookups = playerMeetings.filter((m: Meeting) => 
        m.performance_rating && Number(m.performance_rating) > 0).length;
      const cpn = hookups > 0 ? totalSpent / hookups : 0;

      const playerWithStats: PlayerWithStats = {
        ...player,
        totalMeetings,
        totalSpent: Math.round(totalSpent),
        averageRating: Number(averageRating.toFixed(1)),
        dateExperienceRating: Number(dateExperienceRating.toFixed(1)),
        performanceRating: Number(performanceRating.toFixed(1)),
        cpn: Math.round(cpn)
      };
      
      // Store in cache
      playerCache.set(cacheKey, playerWithStats);
      console.log('✅ Player stats loaded for:', player.name);
      
      return playerWithStats;
    } catch (error) {
      console.error('❌ Error in getPlayerWithStats:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to load player details');
    }
  },

  /**
   * Get active players (basic data only)
   */
  async getActivePlayersBasic(forceRefresh: boolean = false): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic(forceRefresh);
    return players.filter(p => !p.bench);
  },

  /**
   * Get bench players (basic data only)
   */
  async getBenchPlayersBasic(forceRefresh: boolean = false): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic(forceRefresh);
    return players.filter(p => p.bench);
  },

  /**
   * Get recent players for hub (basic data only)
   */
  async getRecentPlayersBasic(limit: number = 3, forceRefresh: boolean = false): Promise<PlayerBasic[]> {
    const cacheKey = `recent_basic_${limit}`;
    const cached = !forceRefresh && playerCache.get(cacheKey);
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
   * Clear cache for a specific player
   */
  invalidatePlayerCache(playerId: string) {
    // Clear all keys for this player, regardless of meeting count
    playerCache.getKeys()
      .filter(key => key.startsWith(`player_stats_${playerId}`))
      .forEach(key => playerCache.remove(key));

    // Also clear basic lists since they might contain this player
    playerCache.remove('players_basic');
    // Clear recent players cache since order might change
    for (let i = 1; i <= 10; i++) { // Clear common limit sizes
      playerCache.remove(`recent_basic_${i}`);
    }
    console.log(`🔄 Cache invalidated for player: ${playerId}`);
  },

  /**
   * Clear entire cache
   */
  clearCache() {
    playerCache.clear();
    console.log('🧹 Fast player cache cleared');
  }
};