/**
 * Enhanced Player Service with Two-Tier Loading Architecture
 * 
 * TIER 1: Essential data for cards/lists (fast initial load)
 * TIER 2: Complete profile data (on-demand detailed load)
 */

import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;

// TIER 1: Minimal data for fast initial display
export interface PlayerBasic {
  id: string;
  name: string;
  image_url?: string;
  status?: string;
  bench?: boolean;
}

// TIER 2: Complete player data with all details
export interface PlayerDetailed extends PlayerBasic {
  looks_rating?: number;
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  meetings?: Meeting[];
  // Calculated stats
  totalMeetings: number;
  totalSpent: number;
  hookups: number;
  cpn: number;
  averageRating: number;
  performanceRating: number;
  dateRating: number;
}

// In-memory cache for performance optimization
class PlayerCache {
  private basicCache = new Map<string, { data: PlayerBasic[]; timestamp: number }>();
  private detailedCache = new Map<string, { data: PlayerDetailed; timestamp: number }>();
  private readonly TTL_BASIC = 5 * 60 * 1000; // 5 minutes for basic data
  private readonly TTL_DETAILED = 2 * 60 * 1000; // 2 minutes for detailed data

  setBasicPlayers(key: string, data: PlayerBasic[]) {
    this.basicCache.set(key, { data, timestamp: Date.now() });
  }

  getBasicPlayers(key: string): PlayerBasic[] | null {
    const cached = this.basicCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL_BASIC) {
      return cached.data;
    }
    this.basicCache.delete(key);
    return null;
  }

  setDetailedPlayer(id: string, data: PlayerDetailed) {
    this.detailedCache.set(id, { data, timestamp: Date.now() });
  }

  getDetailedPlayer(id: string): PlayerDetailed | null {
    const cached = this.detailedCache.get(id);
    if (cached && Date.now() - cached.timestamp < this.TTL_DETAILED) {
      return cached.data;
    }
    this.detailedCache.delete(id);
    return null;
  }

  invalidatePlayer(id: string) {
    this.detailedCache.delete(id);
    // Also invalidate basic cache entries
    this.basicCache.clear();
  }

  clear() {
    this.basicCache.clear();
    this.detailedCache.clear();
  }
}

const playerCache = new PlayerCache();

// Statistics calculation utility
function calculatePlayerStats(player: any, meetings: Meeting[]): Omit<PlayerDetailed, keyof PlayerBasic | 'likes' | 'dislikes' | 'notes' | 'user_id' | 'meetings'> {
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

export const playerService = {
  /**
   * TIER 1: Get minimal player data for ultra-fast initial display
   * Only essential fields: name, image, status, bench
   */
  async getPlayersBasic(forceRefresh = false): Promise<PlayerBasic[]> {
    const cacheKey = 'all_basic_players';
    
    if (!forceRefresh) {
      const cached = playerCache.getBasicPlayers(cacheKey);
      if (cached) {
        console.log('⚡ TIER 1: Using cached minimal player data');
        return cached;
      }
    }

    console.log('🚀 TIER 1: Fetching minimal player data (name, image, status, bench only)...');
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        image_url,
        status,
        bench
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ TIER 1: Error fetching minimal players:', error);
      throw error;
    }
    
    const basicPlayers = players || [];
    playerCache.setBasicPlayers(cacheKey, basicPlayers);
    
    console.log('⚡ TIER 1: Minimal players loaded instantly:', basicPlayers.length, 'players');
    return basicPlayers;
  },

  /**
   * TIER 2: Get complete player details with all profile information
   * Comprehensive query for detailed view
   */
  async getPlayerDetailed(playerId: string, forceRefresh = false): Promise<PlayerDetailed> {
    if (!forceRefresh) {
      const cached = playerCache.getDetailedPlayer(playerId);
      if (cached) {
        console.log('📦 Using cached detailed player data for:', cached.name);
        return cached;
      }
    }

    console.log('🔍 Fetching detailed player data for ID:', playerId);
    
    try {
      // Step 1: Get complete player profile data
      const { data: player, error: playerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (playerError) {
        console.error('❌ Error fetching player profile:', playerError);
        throw new Error(`Failed to fetch player: ${playerError.message}`);
      }
      
      if (!player) {
        throw new Error('Player not found');
      }
      
      console.log('🎯 RAW PLAYER DATA FROM SUPABASE:');
      console.log('Full player object:', JSON.stringify(player, null, 2));
      console.log('Likes field:', player.likes, 'Type:', typeof player.likes);
      console.log('Dislikes field:', player.dislikes, 'Type:', typeof player.dislikes);
      console.log('Notes field:', player.notes, 'Type:', typeof player.notes);
      
      // Step 2: Get meetings data separately
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('amount_spent, rating, performance_rating, date, created_at')
        .eq('profile_id', playerId)
        .order('date', { ascending: false });
      
      if (meetingsError) {
        console.error('❌ Error fetching meetings:', meetingsError);
        // Don't throw - continue with empty meetings
      }
      
      const playerMeetings = meetings || [];
      console.log('📊 Meetings loaded:', playerMeetings.length);
      
      // Step 3: Calculate stats
      const stats = calculatePlayerStats(player, playerMeetings);
      
      // Step 4: Combine all data
      const detailedPlayer: PlayerDetailed = {
        ...player,
        meetings: playerMeetings,
        ...stats
      };
      
      console.log('✅ FINAL DETAILED PLAYER OBJECT:');
      console.log('Likes:', detailedPlayer.likes);
      console.log('Dislikes:', detailedPlayer.dislikes);
      console.log('Notes:', detailedPlayer.notes);
      
      // Cache the result
      playerCache.setDetailedPlayer(playerId, detailedPlayer);
      
      return detailedPlayer;
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR in getPlayerDetailed:', error);
      throw error;
    }
  },

  /**
   * Get active players (minimal data only)
   */
  async getActivePlayers(): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic();
    return players.filter(player => !player.bench);
  },

  /**
   * Get bench players (minimal data only)
   */
  async getBenchPlayers(): Promise<PlayerBasic[]> {
    const players = await this.getPlayersBasic();
    return players.filter(player => player.bench);
  },

  /**
   * Get recent players with minimal data for hub display
   */
  async getRecentPlayersBasic(limit: number = 3): Promise<PlayerBasic[]> {
    const cacheKey = `recent_players_basic_${limit}`;
    
    // Check cache first
    const cached = playerCache.getBasicPlayers(cacheKey);
    if (cached) {
      console.log('⚡ Using cached recent players basic data');
      return cached.slice(0, limit);
    }

    console.log('🔄 TIER 1: Fetching recent players (minimal data)...');
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        image_url,
        status,
        bench,
        updated_at
      `)
      .eq('bench', false)
      .limit(limit)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ TIER 1: Error fetching recent players:', error);
      throw error;
    }
    
    const basicPlayers = players || [];
    playerCache.setBasicPlayers(cacheKey, basicPlayers);
    
    console.log('⚡ TIER 1: Recent players loaded instantly:', basicPlayers.length);
    return basicPlayers;
  },

  /**
   * Create new player
   */
  async createPlayer(playerData: Inserts<'profiles'>): Promise<Player> {
    console.log('🆕 Creating new player:', playerData);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(playerData)
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error creating player:', error);
      throw error;
    }
    
    // Clear cache to include new player
    playerCache.clear();
    
    console.log('✅ Player created successfully:', data);
    return data;
  },

  /**
   * Update player
   */
  async updatePlayer(id: string, updates: Updates<'profiles'>): Promise<Player> {
    console.log('📝 Updating player:', id, updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error updating player:', error);
      throw error;
    }
    
    // Invalidate cache for this player
    playerCache.invalidatePlayer(id);
    
    console.log('✅ Player updated successfully:', data);
    return data;
  },

  /**
   * Delete player
   */
  async deletePlayer(id: string): Promise<void> {
    console.log('🗑️ Deleting player:', id);
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting player:', error);
      throw error;
    }
    
    // Clear cache
    playerCache.invalidatePlayer(id);
    
    // Also clear the persistent cache to force roster refresh
    const { persistentCache } = await import('../lib/storage');
    persistentCache.clear();
    
    console.log('✅ Player deleted successfully');
  },

  /**
   * Clear all cached data
   */
  clearCache(): void {
    playerCache.clear();
    console.log('🧹 Player cache cleared');
  }
};