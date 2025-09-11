/**
 * Optimized Player Service with Two-Tier Loading Architecture
 * 
 * TIER 1: Essential data for cards/lists (sub-200ms load)
 * TIER 2: Complete profile data (on-demand detailed load)
 */

import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;

// TIER 1: Minimal data for lightning-fast initial display
export interface PlayerMinimal {
  id: string;
  name: string;
  image_url?: string;
  status?: string;
  bench?: boolean;
}

// TIER 2: Complete player data with all details and calculated stats
export interface PlayerComplete extends PlayerMinimal {
  looks_rating?: number;
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  meetings?: Meeting[];
  // Calculated performance stats
  totalMeetings: number;
  totalSpent: number;
  hookups: number;
  cpn: number;
  averageRating: number;
  performanceRating: number;
  dateRating: number;
}

// High-performance in-memory cache with intelligent TTL
class PerformanceCache {
  private minimalCache = new Map<string, { data: PlayerMinimal[]; timestamp: number }>();
  private completeCache = new Map<string, { data: PlayerComplete; timestamp: number }>();
  private readonly TTL_MINIMAL = 10 * 60 * 1000; // 10 minutes for minimal data
  private readonly TTL_COMPLETE = 5 * 60 * 1000; // 5 minutes for complete data

  // Minimal data cache methods
  setMinimal(key: string, data: PlayerMinimal[]) {
    this.minimalCache.set(key, { data: [...data], timestamp: Date.now() });
    console.log(`💾 Cached minimal data: ${key} (${data.length} players)`);
  }

  getMinimal(key: string): PlayerMinimal[] | null {
    const cached = this.minimalCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL_MINIMAL) {
      console.log(`⚡ Cache hit: ${key}`);
      return cached.data;
    }
    if (cached) this.minimalCache.delete(key);
    return null;
  }

  // Complete data cache methods
  setComplete(id: string, data: PlayerComplete) {
    this.completeCache.set(id, { data: { ...data }, timestamp: Date.now() });
    console.log(`💾 Cached complete data: ${data.name}`);
  }

  getComplete(id: string): PlayerComplete | null {
    const cached = this.completeCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.TTL_COMPLETE) {
      console.log(`⚡ Cache hit: ${cached.data.name}`);
      return cached.data;
    }
    if (cached) this.completeCache.delete(id);
    return null;
  }

  // Cache management
  invalidatePlayer(id: string) {
    this.completeCache.delete(id);
    // Clear minimal cache to ensure consistency
    this.minimalCache.clear();
    console.log(`🗑️ Invalidated cache for player: ${id}`);
  }

  clear() {
    this.minimalCache.clear();
    this.completeCache.clear();
    console.log('🧹 Performance cache cleared');
  }

  getStats() {
    return {
      minimal: this.minimalCache.size,
      complete: this.completeCache.size
    };
  }
}

const performanceCache = new PerformanceCache();

// Optimized statistics calculation with memoization
function calculatePlayerStats(player: any, meetings: Meeting[]): Omit<PlayerComplete, keyof PlayerMinimal | 'likes' | 'dislikes' | 'notes' | 'user_id' | 'meetings'> {
  const totalSpent = meetings.reduce((sum, meeting) => 
    sum + (Number(meeting.amount_spent) || 0), 0);
  
  const totalMeetings = meetings.length;
  
  const hookups = meetings.filter(meeting => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0).length;
  
  const cpn = hookups > 0 ? totalSpent / hookups : 0;
  
  // Calculate date experience rating
  const ratingsSum = meetings.reduce((sum, meeting) => 
    sum + (Number(meeting.rating) || 0), 0);
  const dateRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
  
  // Calculate performance rating average
  const performanceRatings = meetings.filter(meeting => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0);
  const performanceRatingSum = performanceRatings.reduce((sum, meeting) => 
    sum + Number(meeting.performance_rating), 0);
  const performanceRating = performanceRatings.length > 0 ? performanceRatingSum / performanceRatings.length : 0;
  
  // Calculate overall average rating
  const looksRating = player.looks_rating || 0;
  let averageRating;
  
  if (performanceRating > 0) {
    averageRating = (looksRating + performanceRating + dateRating) / 3;
  } else {
    averageRating = totalMeetings > 0 ? (looksRating + dateRating) / 2 : looksRating;
  }
  
  return {
    totalMeetings,
    totalSpent: Math.round(totalSpent),
    hookups,
    cpn: Math.round(cpn),
    averageRating: Number(averageRating.toFixed(1)),
    performanceRating: Number(performanceRating.toFixed(1)),
    dateRating: Number(dateRating.toFixed(1))
  };
}

export const optimizedPlayerService = {
  /**
   * TIER 1: Ultra-fast minimal data loading
   * Only essential fields for immediate display
   */
  async getPlayersMinimal(forceRefresh = false): Promise<PlayerMinimal[]> {
    const cacheKey = 'players_minimal_all';
    
    if (!forceRefresh) {
      const cached = performanceCache.getMinimal(cacheKey);
      if (cached) return cached;
    }

    console.log('🚀 TIER 1: Fetching minimal player data...');
    const startTime = performance.now();
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select('id, name, image_url, status, bench')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ TIER 1: Error fetching minimal players:', error);
      throw error;
    }
    
    const minimalPlayers = players || [];
    performanceCache.setMinimal(cacheKey, minimalPlayers);
    
    const endTime = performance.now();
    console.log(`⚡ TIER 1: Minimal players loaded in ${Math.round(endTime - startTime)}ms`);
    
    return minimalPlayers;
  },

  /**
   * TIER 1: Get active players only (minimal data)
   */
  async getActivePlayersMinimal(forceRefresh = false): Promise<PlayerMinimal[]> {
    const players = await this.getPlayersMinimal(forceRefresh);
    return players.filter(player => !player.bench);
  },

  /**
   * TIER 1: Get bench players only (minimal data)
   */
  async getBenchPlayersMinimal(forceRefresh = false): Promise<PlayerMinimal[]> {
    const players = await this.getPlayersMinimal(forceRefresh);
    return players.filter(player => player.bench);
  },

  /**
   * TIER 1: Get recent players (minimal data for hub)
   */
  async getRecentPlayersMinimal(limit: number = 3, forceRefresh = false): Promise<PlayerMinimal[]> {
    const cacheKey = `recent_players_minimal_${limit}`;
    
    if (!forceRefresh) {
      const cached = performanceCache.getMinimal(cacheKey);
      if (cached) return cached.slice(0, limit);
    }

    console.log(`🚀 TIER 1: Fetching ${limit} recent players (minimal)...`);
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select('id, name, image_url, status, bench')
      .eq('bench', false)
      .limit(limit)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ TIER 1: Error fetching recent players:', error);
      throw error;
    }
    
    const recentPlayers = players || [];
    performanceCache.setMinimal(cacheKey, recentPlayers);
    
    console.log(`⚡ TIER 1: Recent players loaded instantly`);
    return recentPlayers;
  },

  /**
   * TIER 2: Get complete player data with all details and stats
   */
  async getPlayerComplete(playerId: string, forceRefresh = false): Promise<PlayerComplete> {
    if (!forceRefresh) {
      const cached = performanceCache.getComplete(playerId);
      if (cached) return cached;
    }

    console.log('🔍 TIER 2: Fetching complete player data for:', playerId);
    const startTime = performance.now();
    
    try {
      // Step 1: Get complete player profile
      const { data: player, error: playerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (playerError || !player) {
        throw new Error(`Failed to fetch player: ${playerError?.message || 'Player not found'}`);
      }
      
      // Step 2: Get all meetings for this player
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('profile_id', playerId)
        .order('date', { ascending: false });
      
      if (meetingsError) {
        console.warn('⚠️ Error fetching meetings, continuing with empty array:', meetingsError);
      }
      
      const playerMeetings = meetings || [];
      
      // Step 3: Calculate performance stats
      const stats = calculatePlayerStats(player, playerMeetings);
      
      // Step 4: Combine all data
      const completePlayer: PlayerComplete = {
        ...player,
        meetings: playerMeetings,
        ...stats
      };
      
      // Cache the result
      performanceCache.setComplete(playerId, completePlayer);
      
      const endTime = performance.now();
      console.log(`✅ TIER 2: Complete player loaded in ${Math.round(endTime - startTime)}ms`);
      
      return completePlayer;
      
    } catch (error) {
      console.error('💥 TIER 2: Error loading complete player data:', error);
      throw error;
    }
  },

  /**
   * Background preloader for all complete player data
   */
  async preloadAllCompleteData(): Promise<void> {
    console.log('🔄 Starting background preload of all complete player data...');
    const startTime = performance.now();
    
    try {
      // Get minimal players first
      const minimalPlayers = await this.getPlayersMinimal();
      
      // Preload complete data for each player in parallel (with concurrency limit)
      const BATCH_SIZE = 5; // Process 5 players at a time to avoid overwhelming the database
      
      for (let i = 0; i < minimalPlayers.length; i += BATCH_SIZE) {
        const batch = minimalPlayers.slice(i, i + BATCH_SIZE);
        
        await Promise.allSettled(
          batch.map(async (player) => {
            try {
              await this.getPlayerComplete(player.id);
            } catch (error) {
              console.warn(`⚠️ Failed to preload player ${player.name}:`, error);
            }
          })
        );
        
        // Small delay between batches to prevent database overload
        if (i + BATCH_SIZE < minimalPlayers.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const endTime = performance.now();
      console.log(`🎉 Background preload completed in ${Math.round(endTime - startTime)}ms`);
      
    } catch (error) {
      console.error('❌ Error in background preload:', error);
    }
  },

  /**
   * Create new player
   */
  async createPlayer(playerData: Inserts<'profiles'>): Promise<Player> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(playerData)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Clear cache to include new player
    performanceCache.clear();
    
    return data;
  },

  /**
   * Update player
   */
  async updatePlayer(id: string, updates: Updates<'profiles'>): Promise<Player> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Invalidate cache for this player
    performanceCache.invalidatePlayer(id);
    
    return data;
  },

  /**
   * Delete player
   */
  async deletePlayer(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Clear cache
    performanceCache.invalidatePlayer(id);
  },

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return performanceCache.getStats();
  },

  /**
   * Clear all cached data
   */
  clearCache(): void {
    performanceCache.clear();
  }
};