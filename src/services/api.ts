import { supabase } from '../lib/supabase';
import { persistentCache } from '../lib/storage';
import type { Tables, Inserts, Updates } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;
type UpcomingDate = Tables<'upcoming_dates'>;

// Cache TTL in minutes
const DEFAULT_TTL = 30; // 30 minutes for persistent storage
const SHORT_TTL = 5; // 5 minutes for frequently changing data

// Helper function to calculate player stats
function calculatePlayerStats(player: any) {
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
  
  // Remove meetings array from response
  const { meetings: _, ...playerWithoutMeetings } = player;
  
  return {
    ...playerWithoutMeetings,
    totalMeetings,
    cpn: Math.round(cpn),
    averageRating: Number(averageRating.toFixed(1))
  };
}

// Player API
export const playerApi = {
  async createPlayer(player: Inserts<'profiles'>) {
    // Clear relevant caches after creating
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive');
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(player)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllPlayers(): Promise<Player[]> {
    const cacheKey = 'getAllPlayers';
    const cached = persistentCache.get<Player[]>(cacheKey);
    if (cached) return cached;

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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const result = (players || []).map(calculatePlayerStats);
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  },

  async getActivePlayers(): Promise<Player[]> {
    const cacheKey = 'getActivePlayers';
    const cached = persistentCache.get<Player[]>(cacheKey);
    if (cached) return cached;

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
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const result = (players || []).map(calculatePlayerStats);
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  },

  async getBenchPlayers(): Promise<Player[]> {
    const cacheKey = 'getBenchPlayers';
    const cached = persistentCache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        meetings (
          amount_spent,
          rating,
          performance_rating
        )
      `)
      .eq('bench', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const result = (data || []).map(calculatePlayerStats);
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  },

  async getRecentlyActive(limit: number = 3): Promise<Player[]> {
    const cacheKey = `getRecentlyActive_${limit}`;
    const cached = persistentCache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        image_url,
        status,
        looks_rating,
        meetings (
          amount_spent,
          rating,
          performance_rating,
          date
        )
      `)
      .eq('bench', false)
      .not('meetings', 'is', null);
    
    if (error) throw error;
    
    // Calculate stats and find most recent meeting date for each player
    const playersWithStats = (players || [])
      .filter(player => player.meetings && player.meetings.length > 0)
      .map(player => {
        const baseStats = calculatePlayerStats(player);
        const meetings = player.meetings || [];
        
        // Find the most recent meeting date
        const mostRecentMeetingDate = meetings.reduce((latest: string, meeting: any) => {
          const meetingDate = meeting.date || meeting.created_at;
          return meetingDate > latest ? meetingDate : latest;
        }, '1970-01-01');
        
        return {
          id: baseStats.id,
          name: baseStats.name,
          image_url: baseStats.image_url,
          status: baseStats.status,
          looks_rating: baseStats.looks_rating,
          totalMeetings: baseStats.totalMeetings,
          cpn: baseStats.cpn,
          averageRating: baseStats.averageRating,
          mostRecentMeetingDate
        };
      })
    .sort((a, b) => new Date(b.mostRecentMeetingDate).getTime() - new Date(a.mostRecentMeetingDate).getTime())
    .slice(0, limit);
    
    // Try to cache with error handling
    try {
      persistentCache.set(cacheKey, playersWithStats, SHORT_TTL);
    } catch (error) {
      console.warn('Failed to cache recently active players:', error);
    }
    return playersWithStats;
  },

  async updatePlayer(id: string, updates: Updates<'profiles'>) {
    // Clear relevant caches after updating
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive_3');
    
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
    // Clear relevant caches after deleting
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive_3');
    
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
    // Clear relevant caches after creating
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive_3');
    persistentCache.delete(`getMeetingsByPlayer_${meeting.profile_id}`);
    persistentCache.delete('getDashboardStats');
    
    const { data, error } = await supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getMeetingsByPlayer(playerId: string): Promise<Meeting[]> {
    const cacheKey = `getMeetingsByPlayer_${playerId}`;
    const cached = persistentCache.get<Meeting[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('profile_id', playerId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    const result = data || [];
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  },

  async updateMeeting(id: string, updates: Updates<'meetings'>) {
    // Clear relevant caches after updating
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive_3');
    persistentCache.delete('getDashboardStats');
    
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
    // Clear relevant caches after deleting
    persistentCache.delete('getAllPlayers');
    persistentCache.delete('getActivePlayers');
    persistentCache.delete('getBenchPlayers');
    persistentCache.delete('getRecentlyActive_3');
    persistentCache.delete('getDashboardStats');
    
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
    // Clear relevant caches after creating
    persistentCache.delete('getUpcomingDates');
    
    const { data, error } = await supabase
      .from('upcoming_dates')
      .insert(date)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUpcomingDates(): Promise<UpcomingDate[]> {
    const cacheKey = 'getUpcomingDates';
    const cached = persistentCache.get<UpcomingDate[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('upcoming_dates')
      .select(`
        *,
        profiles (
          name,
          image_url
        )
      `)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });
    
    if (error) throw error;
    const result = data || [];
    persistentCache.set(cacheKey, result, SHORT_TTL);
    return result;
  },

  async updateDate(id: string, updates: Updates<'upcoming_dates'>) {
    // Clear relevant caches after updating
    persistentCache.delete('getUpcomingDates');
    
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
    // Clear relevant caches after deleting
    persistentCache.delete('getUpcomingDates');
    
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
    const cacheKey = 'getDashboardStats';
    const cached = persistentCache.get<any>(cacheKey);
    if (cached) return cached;

    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('amount_spent, performance_rating');
    
    if (error) throw error;
    
    const totalSpent = meetings?.reduce((sum, meeting) => 
      sum + (Number(meeting.amount_spent) || 0), 0) || 0;
    const totalDates = meetings?.length || 0;
    const totalHookups = meetings?.filter(meeting => 
      meeting.performance_rating && Number(meeting.performance_rating) > 0).length || 0;
    
    const result = {
      totalSpent: Math.round(totalSpent),
      totalDates,
      totalHookups
    };
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  },

  async getTopPlayersByRating(limit: number = 3) {
    const cacheKey = `getTopPlayersByRating_${limit}`;
    const cached = persistentCache.get<any>(cacheKey);
    if (cached) return cached;

    const { data: players, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        image_url,
        looks_rating,
        meetings (
          rating
        )
      `);
    
    if (error) throw error;
    
    // Calculate average ratings and filter players with meetings
    const playersWithRatings = (players || [])
      .map(player => {
        const meetings = player.meetings || [];
        const ratingsSum = meetings.reduce((sum: number, meeting: any) => 
          sum + (Number(meeting.rating) || 0), 0);
        const averageRating = meetings.length > 0 
          ? ratingsSum / meetings.length 
          : (player.looks_rating || 0);
        
        return {
          id: player.id,
          name: player.name,
          image_url: player.image_url,
          average_rating: averageRating,
          meeting_count: meetings.length
        };
      })
      .filter(player => player.meeting_count > 0) // Only players with meetings
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit);
    
    persistentCache.set(cacheKey, playersWithRatings, DEFAULT_TTL);
    return playersWithRatings;
  },

  async getCPNByPeriod(period: 'weekly' | 'monthly' | 'yearly') {
    const cacheKey = `getCPNByPeriod_${period}`;
    const cached = persistentCache.get<any>(cacheKey);
    if (cached) return cached;

    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('amount_spent, performance_rating, date, created_at')
      .not('performance_rating', 'is', null)
      .gt('performance_rating', 0);
    
    if (error) throw error;
    
    if (!meetings || meetings.length === 0) {
      return [];
    }
    
    // Group meetings by time period
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
    const result = Object.entries(groupedData)
      .map(([period, data]) => ({
        period,
        cpn: data.hookups > 0 ? data.totalSpent / data.hookups : 0,
        totalSpent: data.totalSpent,
        hookups: data.hookups
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
    
    persistentCache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  }
};