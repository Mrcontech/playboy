import React, { createContext, useContext, useState, useEffect } from 'react';
import { playerApi, datesApi, statsApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;
type UpcomingDate = Tables<'upcoming_dates'>;

interface AppContextType {
  // Players data
  activePlayers: Player[];
  benchPlayers: Player[];
  recentlyActive: Player[];
  
  // Dates data
  upcomingDates: UpcomingDate[];
  
  // Stats data
  dashboardStats: {
    totalSpent: number;
    totalDates: number;
    totalHookups: number;
    averageCPN: number;
  };
  
  // Loading states
  playersLoading: boolean;
  datesLoading: boolean;
  statsLoading: boolean;
  
  // Refresh functions
  refreshPlayers: () => Promise<void>;
  refreshDates: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Players state
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<Player[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  
  // Dates state
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [datesLoading, setDatesLoading] = useState(true);
  
  // Stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalSpent: 0,
    totalDates: 0,
    totalHookups: 0,
    averageCPN: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshPlayers = async () => {
    try {
      setPlayersLoading(true);
      const [allPlayers, bench, recent] = await Promise.all([
        playerApi.getAllPlayers(),
        playerApi.getBenchPlayers(),
        playerApi.getRecentlyActive(3)
      ]);
      
      const active = allPlayers?.filter(player => !player.bench) || [];
      setActivePlayers(active);
      setBenchPlayers(bench || []);
      setRecentlyActive(recent || []);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setPlayersLoading(false);
    }
  };

  const refreshDates = async () => {
    try {
      setDatesLoading(true);
      const dates = await datesApi.getUpcomingDates();
      setUpcomingDates(dates || []);
    } catch (error) {
      console.error('Error loading dates:', error);
    } finally {
      setDatesLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await statsApi.getDashboardStats();
      const averageCPN = stats.totalHookups > 0 ? stats.totalSpent / stats.totalHookups : 0;
      
      setDashboardStats({
        ...stats,
        averageCPN: Math.round(averageCPN)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      refreshPlayers(),
      refreshDates(),
      refreshStats()
    ]);
  };

  const value: AppContextType = {
    activePlayers,
    benchPlayers,
    recentlyActive,
    upcomingDates,
    dashboardStats,
    playersLoading,
    datesLoading,
    statsLoading,
    refreshPlayers,
    refreshDates,
    refreshStats,
    refreshAll
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}