import { useEffect, useState, useCallback } from 'react';
import { playerApi, statsApi, datesApi } from '../services/api';
import { persistentCache } from '../lib/storage';
import { supabase } from '../lib/supabase';

interface PreloadStatus {
  hub: boolean;
  roster: boolean;
  playbook: boolean;
  settings: boolean;
}

export function useBackgroundPreloader() {
  const [preloadStatus, setPreloadStatus] = useState<PreloadStatus>({
    hub: false,
    roster: false,
    playbook: false,
    settings: false
  });
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadData = useCallback(async () => {
    setIsPreloading(true);
    console.log('🚀 Starting background preload of all app data...');
    
    try {
      // Preload all data in parallel for maximum speed
      const preloadPromises = [
        // Hub data
        preloadHubData(),
        // Roster data  
        preloadRosterData(),
        // Playbook data
        preloadPlaybookData()
      ];

      await Promise.allSettled(preloadPromises);
      
      console.log('✅ Background preload completed successfully');
    } catch (error) {
      console.warn('⚠️ Some background preloading failed:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  const preloadHubData = async () => {
    try {
      console.log('📱 Preloading Hub data...');
      
      await Promise.all([
        // Recent players for hub
        cacheData('getRecentPlayers_3', async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, name, image_url, status, bench')
            .eq('bench', false)
            .limit(3)
            .order('updated_at', { ascending: false });
          
          if (error) throw error;
          return data || [];
        }, 15),
        
        // Upcoming dates
        cacheData('getUpcomingDates', () => datesApi.getUpcomingDates(), 10)
      ]);
      
      setPreloadStatus(prev => ({ ...prev, hub: true }));
      console.log('✅ Hub data preloaded');
    } catch (error) {
      console.warn('⚠️ Hub preload failed:', error);
    }
  };

  const preloadRosterData = async () => {
    try {
      console.log('👥 Preloading Roster data...');
      
      await cacheData('roster_players_basic', async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, image_url, status, bench, created_at, updated_at, user_id')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      }, 30);
      
      setPreloadStatus(prev => ({ ...prev, roster: true }));
      console.log('✅ Roster data preloaded');
    } catch (error) {
      console.warn('⚠️ Roster preload failed:', error);
    }
  };

  const preloadPlaybookData = async () => {
    try {
      console.log('📊 Preloading Playbook data...');
      
      await Promise.all([
        // Dashboard stats
        cacheData('getDashboardStats', () => statsApi.getDashboardStats(), 30),
        
        // CPN data for monthly view (most common)
        cacheData('getCPNByPeriod_monthly', () => statsApi.getCPNByPeriod('monthly'), 30),
        
        // Top players by rating
        cacheData('getTopPlayersByRating_3', () => statsApi.getTopPlayersByRating(3), 25)
      ]);
      
      setPreloadStatus(prev => ({ ...prev, playbook: true }));
      console.log('✅ Playbook data preloaded');
    } catch (error) {
      console.warn('⚠️ Playbook preload failed:', error);
    }
  };

  // Helper function to cache data
  const cacheData = async (key: string, fetcher: () => Promise<any>, ttlMinutes: number) => {
    // Check if already cached
    const cached = persistentCache.get(key);
    if (cached) {
      console.log(`💾 ${key} already cached, skipping`);
      return cached;
    }

    console.log(`🔄 Fetching ${key}...`);
    const data = await fetcher();
    persistentCache.set(key, data, ttlMinutes);
    console.log(`✅ ${key} cached successfully`);
    return data;
  };

  // Start preloading when hook is first used
  useEffect(() => {
    // Small delay to let the initial page load first
    const timer = setTimeout(() => {
      preloadData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [preloadData]);

  return {
    preloadStatus,
    isPreloading,
    preloadData
  };
}