import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;
type UpcomingDate = Tables<'upcoming_dates'>;

// Simple helper function to calculate player stats
function calculatePlayerStats(player: any, playerMeetings: any[]) {
  const totalSpent = playerMeetings.reduce((sum: number, meeting: any) => 
    sum + (Number(meeting.amount_spent) || 0), 0);
  
  const hookups = playerMeetings.filter(meeting => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0).length;
  const totalMeetings = playerMeetings.length;
  const cpn = hookups > 0 ? totalSpent / hookups : 0;
  
  // Calculate date experience rating (average of all meeting ratings)
  const ratingsSum = playerMeetings.reduce((sum: number, meeting: any) => 
    sum + (Number(meeting.rating) || 0), 0);
  const dateRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
  
  // Calculate performance rating average
  const performanceRatings = playerMeetings.filter(meeting => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0);
  const performanceRatingSum = performanceRatings.reduce((sum: number, meeting: any) => 
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
    ...player,
    totalMeetings,
    totalSpent: Math.round(totalSpent),
    hookups,
    cpn: Math.round(cpn),
    averageRating: Number(averageRating.toFixed(1)),
    performanceRating: Number(performanceRating.toFixed(1)),
    dateRating: Number(dateRating.toFixed(1))
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
    return data;
  },

  async getAllPlayers(): Promise<Player[]> {
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: players, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return players || [];
  },

  async getPlayerDetails(playerId: string): Promise<Player> {
    console.log('🔍 Fetching detailed data for player:', playerId);
    
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Step 1: Get complete player profile data with user check
    const { data: player, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('❌ Supabase error fetching player details:', error);
      throw error;
    }
    
    if (!player) {
      console.error('❌ Player not found for ID:', playerId);
      throw new Error('Player not found');
    }
    
    // Step 2: Get meetings data separately with user check
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('profile_id', playerId);
    
    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError);
      // Don't throw - continue with empty meetings
    }
    
    const playerMeetings = meetings || [];
    console.log('📊 Meetings loaded:', playerMeetings.length);
    
    // Step 3: Calculate stats
    const playerWithStats = calculatePlayerStats(player, playerMeetings);
    
    console.log('✅ FINAL DETAILED PLAYER WITH PROPER STATS:', {
      name: playerWithStats.name,
      performanceRating: playerWithStats.performanceRating,
      dateRating: playerWithStats.dateRating,
      averageRating: playerWithStats.averageRating
    });
    
    return playerWithStats;
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
    console.log('🔍 Fetching upcoming dates from database...');
    
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Get today's date in YYYY-MM-DD format to avoid timezone issues
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('📅 Current date for filtering:', currentDate);
    
    const { data, error } = await supabase
      .from('upcoming_dates')
      .select(`
        *,
        profiles!inner (
          name,
          image_url,
          user_id
        )
      `)
      .eq('profiles.user_id', user.id)
      .gte('date', currentDate + 'T00:00:00.000Z')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching upcoming dates:', error);
      throw error;
    }
    
    console.log('✅ Upcoming dates fetched:', data?.length || 0, 'dates');
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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get meetings for current user only
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select(`
          amount_spent, 
          performance_rating, 
          created_at, 
          rating,
          profiles!inner (
            user_id
          )
        `)
        .eq('profiles.user_id', user.id);
      
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
      
      // Calculate total spent from ALL meetings (not just hookups)
      const totalSpent = meetings.reduce((sum, meeting) => {
        const amount = Number(meeting.amount_spent) || 0;
        return sum + amount;
      }, 0);
      
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

  async getTopPlayersByRating(limit: number = 3) {
    console.log('🏆 Fetching top players with limit:', limit);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

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
      .eq('user_id', user.id)
      .limit(50);
    
    if (error) throw error;
    
    if (!players || players.length === 0) {
      console.log('🏆 No players found for top ratings');
      return [];
    }
    
    // Calculate stats using meetings data for each player
    const playersWithStats = players.map(player => {
      const meetings = player.meetings || [];
      return calculatePlayerStats(player, meetings);
    });
    
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
        cpn: player.cpn,
        averageRating: player.averageRating,
        performanceRating: player.performanceRating,
        dateRating: player.dateRating
      }))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);
    
    console.log('🏆 Top players calculated:', playersWithRatings.length, 'players');
    
    return playersWithRatings;
  },

  async getRecentPlayers(limit: number = 3): Promise<Player[]> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

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
      .eq('user_id', user.id)
      .limit(limit)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    return (players || []).map(player => calculatePlayerStats(player, player.meetings || []));
  },

  async getCPNByPeriod(period: 'weekly' | 'monthly' | 'yearly') {
    console.log('📊 Calculating CPN for period:', period);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: meetings, error } = await supabase
      .from('meetings')
      .select(`
        amount_spent, 
        performance_rating, 
        date, 
        created_at,
        profiles!inner (
          user_id
        )
      `)
      .eq('profiles.user_id', user.id)
      .gt('performance_rating', 0)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    if (!meetings || meetings.length === 0) {
      console.log('📊 No CPN data available for period:', period);
      return [];
    }
    
    // Group data by period
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