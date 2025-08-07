import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;
type UpcomingDate = Tables<'upcoming_dates'>;

// Optimized helper function to calculate player stats with memoization
const statsCache = new Map<string, any>();

function calculatePlayerStats(player: any, useCache = true) {
  const cacheKey = `${player.id}_${player.updated_at}`;
  
  if (useCache && statsCache.has(cacheKey)) {
    return { ...player, ...statsCache.get(cacheKey) };
  }
  
  const meetings = player.meetings || [];
  const totalSpent = meetings.reduce((sum: number, meeting: any) => 
    sum + (Number(meeting.amount_spent) || 0), 0);
  const totalMeetings = meetings.length;
  const hookups = meetings.filter((meeting: any) => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0).length;
  const cpn = hookups > 0 ? totalSpent / hookups : 0;
  
  const ratingsSum = meetings.reduce((sum: number, meeting: any) => 
    sum + (Number(meeting.rating) || 0), 0);
  const dateExperienceRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
  
  // Calculate performance rating average
  const performanceRatings = meetings.filter((meeting: any) => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0);
  const performanceRatingSum = performanceRatings.reduce((sum: number, meeting: any) => 
    sum + Number(meeting.performance_rating), 0);
  const avgPerformanceRating = performanceRatings.length > 0 ? performanceRatingSum / performanceRatings.length : 0;
  
  // Calculate overall average rating
  const looksRating = player.looks_rating || 0;
  let averageRating;
  
  if (avgPerformanceRating > 0) {
    // Include all three: looks, performance, date experience
    averageRating = (looksRating + avgPerformanceRating + dateExperienceRating) / 3;
  } else {
    // Only looks and date experience
    averageRating = totalMeetings > 0 ? (looksRating + dateExperienceRating) / 2 : looksRating;
  }
  
  const calculatedStats = {
    totalMeetings,
    cpn: Math.round(cpn),
    averageRating: Number(averageRating.toFixed(1))
  };
  
  // Cache the calculated stats
  if (useCache) {
    statsCache.set(cacheKey, calculatedStats);
  }
  
  // Remove meetings array from response to reduce memory usage
  const { meetings: _, ...playerWithoutMeetings } = player;
  
  return {
    ...playerWithoutMeetings,
    ...calculatedStats
  };
}

// Player API
export const playerApi = {
  async createPlayer(player: Inserts<'profiles'>) {
    console.log('API: Creating player with data:', player);
    const { data, error } = await supabase
      .from('profiles')
      .insert(player)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating player:', error);
      throw error;
    }
    console.log('API: Player created successfully:', data);
    
    // Clear relevant caches when new player is created
    statsCache.clear();
    
    return data;
  },

  // New lightweight query for initial roster load - only essential fields
  async getPlayersBasic(): Promise<Partial<Player>[]> {
    console.log('🚀 Fetching basic player data for roster...');
    const { data: players, error } = await supabase
      .from('profiles')
      .select('id, name, image_url, status, looks_rating, bench, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log('✅ Basic player data loaded:', players?.length || 0, 'players');
    return players || [];
  },

  // New method to get detailed player data on-demand
  async getPlayerDetails(playerId: string): Promise<Player> {
    console.log('🔍 Fetching detailed data for player:', playerId);
    console.log('🔍 EMERGENCY DEBUG: About to query Supabase for player details');
    
    const { data: player, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching player details:', error);
      throw error;
    }
    
    if (!player) {
      console.error('❌ Player not found for ID:', playerId);
      throw new Error('Player not found');
    }
    
    console.log('🚨 EMERGENCY DEBUG - RAW SUPABASE RESPONSE:');
    console.log('Player object keys:', Object.keys(player));
    console.log('Full player object:', player);
    console.log('Likes value:', player.likes);
    console.log('Dislikes value:', player.dislikes);
    console.log('Notes value:', player.notes);
    console.log('Likes type:', typeof player.likes);
    console.log('Dislikes type:', typeof player.dislikes);
    console.log('Notes type:', typeof player.notes);
    
    // Now fetch meetings separately to avoid any join issues
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('profile_id', playerId);
    
    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError);
    }
    
    // Attach meetings to player object
    const playerWithMeetings = {
      ...player,
      meetings: meetings || []
    };
    
    console.log('🔍 Final player object with meetings:', playerWithMeetings);
    
    return calculatePlayerStats(playerWithMeetings, true);
  },

  // Optimized query with selective field loading
  async getAllPlayers(includeStats = true): Promise<Player[]> {
    const baseQuery = supabase
      .from('profiles')
      .select(includeStats ? `
        id, name, image_url, status, looks_rating, bench, created_at, updated_at, user_id,
        meetings!inner (
          amount_spent,
          rating,
          performance_rating
        )
      ` : 'id, name, image_url, status, looks_rating, bench, created_at, updated_at, user_id')
      .order('created_at', { ascending: false });
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select(includeStats ? `
        id, name, image_url, status, looks_rating, bench, created_at, updated_at, user_id,
        meetings (
          amount_spent,
          rating,
          performance_rating
        )
      ` : 'id, name, image_url, status, looks_rating, bench, created_at, updated_at, user_id')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    if (!includeStats) {
      return players || [];
    }
    
    return (players || []).map(player => calculatePlayerStats(player, true));
  },

  async updatePlayer(id: string, updates: Updates<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clear stats cache when player is updated
    statsCache.clear();
    
    return data;
  },

  async deletePlayer(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Clear stats cache when player is deleted
    statsCache.clear();
  }
};

// Meetings API
export const meetingsApi = {
  async createMeeting(meeting: Inserts<'meetings'>) {
    const { data, error } = await supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getMeetingsByPlayer(playerId: string): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('profile_id', playerId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async updateMeeting(id: string, updates: Updates<'meetings'>) {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMeeting(id: string) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Dates API
export const datesApi = {
  async createDate(date: Inserts<'upcoming_dates'>) {
    const { data, error } = await supabase
      .from('upcoming_dates')
      .insert(date)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUpcomingDates(): Promise<UpcomingDate[]> {
    console.log('🔍 Fetching upcoming dates from database...');
    
    // Get today's date in YYYY-MM-DD format to avoid timezone issues
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('📅 Current date for filtering:', currentDate);
    
    const { data, error } = await supabase
      .from('upcoming_dates')
      .select(`
        *,
        profiles (
          name,
          image_url
        )
      `)
      .gte('date', currentDate + 'T00:00:00.000Z')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching upcoming dates:', error);
      throw error;
    }
    
    console.log('✅ Upcoming dates fetched:', data?.length || 0, 'dates');
    if (data && data.length > 0) {
      console.log('📋 Upcoming dates details:', data.map(d => ({
        date: d.date,
        type: d.type,
        profile_name: d.profiles?.name
      })));
    }
    
    return data || [];
  },

  async updateDate(id: string, updates: Updates<'upcoming_dates'>) {
    const { data, error } = await supabase
      .from('upcoming_dates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteDate(id: string) {
    const { error } = await supabase
      .from('upcoming_dates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Stats API for Playbook
export const statsApi = {
  async getDashboardStats() {
    console.log('Fetching fresh dashboard stats...');
    
    try {
      // Optimized query - only get necessary fields for stats calculation
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('amount_spent, performance_rating, created_at');
      
      if (error) {
        console.error('Supabase error fetching meetings for stats:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!meetings) {
        console.warn('No meetings data returned from Supabase');
        return {
          totalSpent: 0,
          totalDates: 0,
          totalHookups: 0
        };
      }
      
      console.log('📊 Processing', meetings.length, 'meetings for dashboard stats');
      
      const totalSpent = meetings.reduce((sum, meeting) => 
        sum + (Number(meeting.amount_spent) || 0), 0);
      const totalDates = meetings.length;
      
      // Optimized hookup detection
      const hookupMeetings = meetings.filter(meeting => {
        return meeting.performance_rating !== null && 
               meeting.performance_rating !== undefined && 
               Number(meeting.performance_rating) > 0;
      });
      
      const totalHookups = hookupMeetings.length;
      
      console.log('📈 Dashboard stats calculated:', {
        totalSpent,
        totalDates,
        totalHookups,
        averageCPN: totalHookups > 0 ? Math.round(totalSpent / totalHookups) : 0
      });
      
      return {
        totalSpent: Math.round(totalSpent),
        totalDates,
        totalHookups
      };
    } catch (err) {
      console.error('Error fetching meetings for stats:', err);
      
      // Return fallback stats instead of throwing
      return {
        totalSpent: 0,
        totalDates: 0,
        totalHookups: 0
      };
    }
  },

  // Highly optimized top players query with minimal data transfer
  async getTopPlayersByRating(limit: number = 3) {
    console.log('🏆 Fetching top players with limit:', limit);
    
    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id, name, image_url, status, looks_rating, created_at, updated_at, user_id,
        meetings (
          amount_spent,
          rating,
          performance_rating
        )
      `)
      .eq('bench', false)
      .limit(50); // Pre-filter to reduce data transfer, then sort client-side
    
    if (error) throw error;
    
    if (!players || players.length === 0) {
      console.log('🏆 No players found for top ratings');
      return [];
    }
    
    // Use optimized stats calculation with caching
    const playersWithStats = players.map(player => calculatePlayerStats(player, true));
    
    // Filter and sort efficiently
    const playersWithRatings = playersWithStats
      .filter(player => player.totalMeetings > 0) // Only players with meetings
      .map(player => ({
        id: player.id,
        name: player.name,
        image_url: player.image_url,
        looks_rating: player.looks_rating,
        status: player.status,
        average_rating: player.averageRating,
        meeting_count: player.totalMeetings,
        // Only include essential data to reduce memory usage
        cpn: player.cpn,
        averageRating: player.averageRating
      }))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);
    
    console.log('🏆 Top players calculated:', playersWithRatings.length, 'players');
    
    return playersWithRatings;
  },

  // Highly optimized recent players query - only essential data
  async getRecentPlayers(limit: number = 3): Promise<Player[]> {
    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id, name, image_url, status, looks_rating, bench, created_at, updated_at, user_id,
        meetings (
          amount_spent,
          rating,
          performance_rating
        )
      `)
      .eq('bench', false)
      .limit(limit)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    return (players || []).map(player => calculatePlayerStats(player, true));
  },

  // Optimized CPN calculation with better query performance
  async getCPNByPeriod(period: 'weekly' | 'monthly' | 'yearly') {
    console.log('📊 Calculating CPN for period:', period);
    
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('amount_spent, performance_rating, date, created_at')
      .gt('performance_rating', 0)
      .order('date', { ascending: true }); // Pre-sort for better performance
    
    if (error) throw error;
    
    if (!meetings || meetings.length === 0) {
      console.log('📊 No CPN data available for period:', period);
      return [];
    }
    
    // Optimized grouping with Map for better performance
    const groupedData: { [key: string]: { totalSpent: number; hookups: number } } = {};
    
    meetings.forEach(meeting => {
      const date = new Date(meeting.date || meeting.created_at);
      let periodKey: string;
      
      switch (period) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = date.getFullYear().toString();
          break;
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = { totalSpent: 0, hookups: 0 };
      }
      
      groupedData[periodKey].totalSpent += Number(meeting.amount_spent) || 0;
      groupedData[periodKey].hookups += 1;
    });
    
    // Convert to array and calculate CPN efficiently
    const result = Object.entries(groupedData).map(([period, data]) => ({
      period,
      cpn: data.hookups > 0 ? Math.round(data.totalSpent / data.hookups) : 0,
      totalSpent: data.totalSpent,
      hookups: data.hookups
    })).sort((a, b) => a.period.localeCompare(b.period));
    
    console.log('📊 CPN data calculated:', result.length, 'periods');
    return result;
  }
};