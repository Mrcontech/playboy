import { supabase } from '../lib/supabase';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;
type UpcomingDate = Tables<'upcoming_dates'>;

// Simple helper function to calculate player stats from meetings
function calculatePlayerStats(player: Player, meetings: Meeting[]) {
  const totalSpent = meetings.reduce((sum, meeting) => 
    sum + (Number(meeting.amount_spent) || 0), 0);
  
  const totalMeetings = meetings.length;
  
  // Calculate hookups (meetings with performance_rating > 0)
  const hookups = meetings.filter(meeting => 
    meeting.performance_rating && Number(meeting.performance_rating) > 0).length;
  
  const cpn = hookups > 0 ? totalSpent / hookups : 0;
  
  // Calculate date experience rating (average of all meeting ratings)
  const ratingsSum = meetings.reduce((sum, meeting) => 
    sum + (Number(meeting.rating) || 0), 0);
  const dateRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
  
  // Calculate performance rating average (only from meetings with performance_rating > 0)
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
    const { data, error } = await supabase
      .from('profiles')
      .insert(player)
      .select()
      .single();
    
    if (error) throw error;
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

  async getPlayerDetails(playerId: string) {
    console.log('🔍 Loading player details for:', playerId);
    
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    // Get player data
    const { data: player, error: playerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .eq('user_id', user.id)
      .single();
    
    if (playerError) {
      console.error('❌ Error fetching player:', playerError);
      throw playerError;
    }
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    console.log('✅ Player loaded:', player.name);
    
    // Get meetings data
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('profile_id', playerId);
    
    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError);
      // Continue with empty meetings rather than failing
    }
    
    const playerMeetings = meetings || [];
    console.log('📊 Meetings loaded:', playerMeetings.length);
    
    // Calculate stats
    const playerWithStats = calculatePlayerStats(player, playerMeetings);
    
    console.log('✅ Final player with stats:', {
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
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    const today = new Date().toISOString().split('T')[0];
    
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
      .gte('date', today + 'T00:00:00.000Z')
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
        profiles!inner (
          user_id
        )
      `)
      .eq('profiles.user_id', user.id);
    
    if (error) throw error;
    
    if (!meetings) {
      return {
        totalSpent: 0,
        totalDates: 0,
        totalHookups: 0
      };
    }
    
    const totalSpent = meetings.reduce((sum, meeting) => {
      const amount = Number(meeting.amount_spent) || 0;
      return sum + amount;
    }, 0);
    
    const totalDates = meetings.length;
    
    const totalHookups = meetings.filter(meeting => {
      return meeting.performance_rating !== null && 
             meeting.performance_rating !== undefined && 
             Number(meeting.performance_rating) > 0;
    }).length;
    
    return {
      totalSpent: Math.round(totalSpent),
      totalDates,
      totalHookups
    };
  },

  async getTopPlayersByRating(limit: number = 3) {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get all players with their meetings
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
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    if (!players || players.length === 0) {
      return [];
    }
    
    // Calculate stats for each player
    const playersWithStats = players.map(player => {
      const meetings = player.meetings || [];
      return calculatePlayerStats(player, meetings);
    });
    
    // Filter and sort
    const topPlayers = playersWithStats
      .filter(player => player.totalMeetings > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit)
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
      }));
    
    return topPlayers;
  },

  async getCPNByPeriod(period: 'weekly' | 'monthly' | 'yearly') {
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
    
    // Convert to array and calculate CPN
    const result = Object.entries(groupedData).map(([period, data]) => ({
      period,
      cpn: data.hookups > 0 ? Math.round(data.totalSpent / data.hookups) : 0,
      totalSpent: data.totalSpent,
      hookups: data.hookups
    })).sort((a, b) => a.period.localeCompare(b.period));
    
    return result;
  }
};