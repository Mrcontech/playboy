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

  // Optimized active players query
  async getActivePlayers(limit?: number): Promise<Player[]> {
    let query = supabase
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
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data: players, error } = await query;
    
    if (error) throw error;
    
    return (players || []).map(calculatePlayerStats);
  },

  async getBenchPlayers(): Promise<Player[]> {
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
      .eq('bench', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (players || []).map(calculatePlayerStats);
  },

  async getRecentPlayers(limit: number = 5): Promise<Player[]> {
    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        *,
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
    
    // Apply proper stats calculation to recent players
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
    return data;
  },

  async deletePlayer(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
    // Get today's date at midnight in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDate = today.toISOString();
    
    const { data, error } = await supabase
      .from('upcoming_dates')
      .select(`
        *,
        profiles (
          name,
          image_url
        )
      `)
      .gte('date', currentDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
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
      // Get all meetings with detailed logging
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*');
      
      if (error) {
        console.error('Supabase error fetching meetings for stats:', error);
        throw new Error(\`Database error: ${error.message}`);
      }
      
      if (!meetings) {
        console.warn('No meetings data returned from Supabase');
        return {
          totalSpent: 0,
          totalDates: 0,
          totalHookups: 0
        };
      }
      
      console.log('Raw meetings data (total count):', meetings.length);
      console.log('All meetings:', meetings);
      
      const totalSpent = meetings.reduce((sum, meeting) => 
        sum + (Number(meeting.amount_spent) || 0), 0);
      const totalDates = meetings.length;
      
      // More detailed hookup detection
      const hookupMeetings = meetings.filter(meeting => {
        const hasPerformanceRating = meeting.performance_rating !== null && meeting.performance_rating !== undefined;
        const ratingValue = Number(meeting.performance_rating);
        const isValidRating = hasPerformanceRating && ratingValue > 0;
        
        if (hasPerformanceRating) {
          console.log(`Meeting ${meeting.id}: performance_rating = ${meeting.performance_rating}, parsed = ${ratingValue}, isValid = ${isValidRating}`);
        }
        
        return isValidRating;
      });
      
      const totalHookups = hookupMeetings.length;
      
      console.log('Detailed stats calculation:', {
        totalSpent,
        totalDates,
        totalHookups,
        hookupMeetings: hookupMeetings.map(m => ({ id: m.id, type: m.type, performance_rating: m.performance_rating })),
        allMeetingsWithPerformanceData: meetings.filter(m => m.performance_rating !== null && m.performance_rating !== undefined).map(m => ({ id: m.id, type: m.type, performance_rating: m.performance_rating }))
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

  async getTopPlayersByRating(limit: number = 3) {
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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Use the same calculatePlayerStats function for consistency
    const playersWithStats = (players || []).map(calculatePlayerStats);
    
    // Filter players with meetings and sort by average rating
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
        // Include all player data for consistency
        ...player
      }))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);
    
    return playersWithRatings;
  },

  async getCPNTrends(period: 'weekly' | 'monthly' | 'yearly' = 'monthly') {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .not('performance_rating', 'is', null)
      .gt('performance_rating', 0)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    if (!meetings || meetings.length === 0) {
      return [];
    }
    
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
      if (meeting.performance_rating && Number(meeting.performance_rating) > 0) {
        groupedData[periodKey].hookups += 1;
      }
    });
    
    // Convert to array and calculate CPN
    return Object.entries(groupedData).map(([period, data]) => ({
      period,
      cpn: data.hookups > 0 ? Math.round(data.totalSpent / data.hookups) : 0,
      totalSpent: data.totalSpent,
      hookups: data.hookups
    })).sort((a, b) => a.period.localeCompare(b.period));
  }
};