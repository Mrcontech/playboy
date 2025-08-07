import React, { memo, useCallback } from 'react';
import { useState, useMemo } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import PlayerCard from './PlayerCard';
import LoadingSpinner from './LoadingSpinner';
import AddDateModal from './AddDateModal';
import UpcomingDateModal from './UpcomingDateModal';
import ChatAnalysisModal from './ChatAnalysisModal';
import SubscriptionBanner from './SubscriptionBanner';
import { useDataLoader } from '../hooks/useDataLoader';
import { datesApi, playerApi } from '../services/api';
import { playerService } from '../services/playerService';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;
type UpcomingDate = Tables<'upcoming_dates'>;

interface HubScreenProps {
  onPlayerSelect?: (player: Player) => void;
}

const HubScreen = memo(function HubScreen({ onPlayerSelect }: HubScreenProps) {
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<UpcomingDate | null>(null);
  const [showChatAnalysis, setShowChatAnalysis] = useState(false);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Load data with persistent caching
  const { 
    data: upcomingDates, 
    loading: datesLoading,
    refetch: refetchDates
  } = useDataLoader({
    key: 'getUpcomingDates',
    fetcher: () => datesApi.getUpcomingDates(),
    ttlMinutes: 10 // Short cache for balance between performance and freshness
  });

  const { 
    data: recentlyActiveBasic, 
    loading: playersLoading,
    refetch: refetchPlayers
  } = useDataLoader({
    key: 'getRecentPlayersBasic_3',
    fetcher: () => playerService.getRecentPlayersBasic(3),
    ttlMinutes: 15 // Shorter cache for faster updates
  });

  const loadData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing hub data...');
      await Promise.all([refetchDates(), refetchPlayers()]);
      console.log('✅ Hub data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing hub data:', error);
    }
  }, [refetchDates, refetchPlayers]);

  // Handle player selection with lazy loading
  const handlePlayerSelect = useCallback(async (player: Player) => {
    if (!player.id) return;
    
    setLoadingPlayerDetails(player.id);
    try {
      console.log('🔍 TIER 2: Loading detailed data for player:', player.name);
      const detailedPlayer = await playerService.getPlayerDetailed(player.id);
      console.log('✅ TIER 2: Detailed data loaded, navigating to profile');
      onPlayerSelect?.(detailedPlayer);
    } catch (error) {
      console.error('❌ Error loading player details:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  // Generate calendar dates for the next 7 days
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Find matching upcoming date with proper validation
      let dateInfo = null;
      if (upcomingDates && !datesLoading) {
        dateInfo = upcomingDates.find(d => {
          // Validate date exists and is valid
          if (!d.date || typeof d.date !== 'string') {
            return false;
          }
          
          try {
            const scheduledDate = new Date(d.date);
            if (isNaN(scheduledDate.getTime())) {
              return false;
            }
            
            const scheduledDateStr = scheduledDate.toISOString().split('T')[0];
            return scheduledDateStr === currentDateStr;
          } catch (error) {
            console.warn('Date parsing error:', error);
            return false;
          }
        });
      }
      
      dates.push({
        date: currentDate.getDate(),
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        active: !!dateInfo && !datesLoading,
        dateInfo: dateInfo || null,
        isLoading: datesLoading
      });
    }
    
    return dates;
  }, [upcomingDates, datesLoading]);

  const handleDateClick = useCallback((dateInfo: UpcomingDate | null) => {
    if (dateInfo) {
      setSelectedDate(dateInfo);
      setShowDateInfoModal(true);
    }
  }, []);

  const getPlayerName = useCallback((profileId: string | null) => {
    if (!profileId) return undefined;
    const player = recentlyActiveBasic?.find(p => p.id === profileId);
    return player?.name;
  }, [recentlyActiveBasic]);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <SubscriptionBanner />
        
        <h1 className="text-3xl font-bold text-white mb-8">Hub Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
          {/* Upcoming Dates Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Upcoming Dates</h2>
              <button 
                onClick={() => setShowAddDateModal(true)}
                className="bg-green-500 hover:bg-green-600 px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="text-black" size={20} />
                <span className="text-black font-medium hidden sm:inline">Add Date</span>
              </button>
            </div>
            
            {/* Loading text while dates are being fetched */}
            {datesLoading && calendarDates && (
              <div className="text-center mb-4">
                <p className="text-green-400 text-sm animate-pulse font-medium">Loading your upcoming dates...</p>
              </div>
            )}
            
            <div className="grid grid-cols-7 gap-2">
              {!calendarDates ? (
                // Loading skeleton for calendar dates
                Array.from({ length: 7 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-2 lg:p-4 rounded-lg text-center bg-gray-800 animate-pulse cursor-default"
                  >
                    <div className="bg-gray-700 h-3 w-8 rounded mx-auto mb-2"></div>
                    <div className="bg-gray-700 h-4 lg:h-6 w-6 lg:w-8 rounded mx-auto"></div>
                  </div>
                ))
              ) : (
                calendarDates.map((date, index) => (
                  <div
                    key={index}
                    className={`p-2 lg:p-4 rounded-lg text-center transition-all duration-300 ${
                      date.active 
                        ? 'bg-green-500 text-black shadow-lg cursor-pointer hover:bg-green-400'
                        : date.isLoading 
                          ? 'bg-gray-800 text-gray-300 animate-pulse cursor-default'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-default'
                    }`}
                    onClick={() => handleDateClick(date.dateInfo)}
                  >
                    <div className="text-xs font-medium mb-1">{date.day}</div>
                    <div className="text-sm lg:text-lg font-bold">{date.date}</div>
                  </div>
                ))
              )}
            </div>
            
          </section>

          {/* Recently Active Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Recently Active</h2>
            
            {playersLoading ? (
              <div className="flex justify-start space-x-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-36 bg-gray-800 rounded-xl">
                    <div className="h-28 bg-gray-700 rounded-t-xl"></div>
                    <div className="p-2 space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-start space-x-3 overflow-x-auto pb-2 px-1">
                  {recentlyActiveBasic?.map((player) => (
                    <div key={player.id} className="relative">
                      <PlayerCard 
                        player={{
                          id: player.id,
                          name: player.name,
                          avatar: player.image_url || '',
                          status: player.status,
                        }}
                        onClick={() => handlePlayerSelect(player)}
                        size="small"
                        isLoading={loadingPlayerDetails === player.id}
                        showBasicInfo={false}
                      />
                      {loadingPlayerDetails === player.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl flex items-center justify-center">
                          <LoadingSpinner size="small" text="Loading..." />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {(!recentlyActiveBasic || recentlyActiveBasic.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    No recently active players
                  </div>
                )}
              </>
            )}
          </section>
        </div>
        
        {/* Chat Upload Section */}
        <section className="bg-black border-2 border-green-500 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">AI Chat Analysis</h2>
            <MessageCircle className="text-purple-500" size={24} />
          </div>
          <div 
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
            onClick={() => setShowChatAnalysis(true)}
          >
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Chat Screenshot</h3>
                <p className="text-gray-400 text-sm mb-4">Get AI insights on your conversations</p>
                <p className="text-gray-500 text-xs">Your personal dating coach will analyze the vibe and suggest your next move</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChatAnalysis(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Choose File
              </button>
            </div>
          </div>
        </section>
      </div>

      <AddDateModal
        isOpen={showAddDateModal}
        onClose={() => setShowAddDateModal(false)}
        onDateAdded={loadData}
      />

      <UpcomingDateModal
        isOpen={showDateInfoModal}
        onClose={() => setShowDateInfoModal(false)}
        date={selectedDate}
        playerName={selectedDate ? getPlayerName(selectedDate.profile_id) : undefined}
      />

      <ChatAnalysisModal
        isOpen={showChatAnalysis}
        onClose={() => setShowChatAnalysis(false)}
      />
    </div>
  );
});

export default HubScreen;