/**
 * Lightning-Fast Hub Screen
 * 
 * PERFORMANCE TARGETS:
 * - Initial load: <200ms
 * - Recent players: <100ms
 * - Calendar dates: <150ms
 */

import React, { memo, useCallback, useState, useMemo } from 'react';
import { Plus, MessageCircle, Zap } from 'lucide-react';
import PlayerCard from './PlayerCard';
import LoadingSpinner from './LoadingSpinner';
import AddDateModal from './AddDateModal';
import UpcomingDateModal from './UpcomingDateModal';
import ChatAnalysisModal from './ChatAnalysisModal';
import SubscriptionBanner from './SubscriptionBanner';
import { useRecentPlayerCards, useLightningOptimization } from '../hooks/useLightningLoader';
import { useDataLoader } from '../hooks/useDataLoader';
import { datesApi } from '../services/api';
import { lightningService } from '../services/lightningService';
import type { PlayerComplete } from '../services/lightningService';
import type { Tables } from '../lib/supabase';

type UpcomingDate = Tables<'upcoming_dates'>;

interface LightningHubScreenProps {
  onPlayerSelect?: (player: PlayerComplete) => void;
}

const LightningHubScreen = memo(function LightningHubScreen({ onPlayerSelect }: LightningHubScreenProps) {
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<UpcomingDate | null>(null);
  const [showChatAnalysis, setShowChatAnalysis] = useState(false);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Lightning-fast recent players loading
  const { 
    data: recentPlayerCards, 
    loading: playersLoading, 
    loadTime: playersLoadTime,
    cacheHit: playersCacheHit 
  } = useRecentPlayerCards(3);

  const { optimizationComplete, optimizationProgress } = useLightningOptimization();

  // Optimized upcoming dates loading
  const { 
    data: upcomingDates, 
    loading: datesLoading,
    refetch: refetchDates
  } = useDataLoader({
    key: 'lightning_upcoming_dates',
    fetcher: () => datesApi.getUpcomingDates(),
    ttlMinutes: 5 // Shorter cache for more frequent updates
  });

  // Lightning-fast player selection
  const handlePlayerSelect = useCallback(async (playerId: string, playerName: string) => {
    if (!onPlayerSelect) return;
    
    setLoadingPlayerDetails(playerId);
    
    try {
      console.log('⚡ Loading complete data for:', playerName);
      const startTime = performance.now();
      
      const completePlayer = await lightningService.getPlayerComplete(playerId);
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Complete player loaded in ${Math.round(loadTime)}ms`);
      
      onPlayerSelect(completePlayer);
    } catch (error) {
      console.error('❌ Error loading player details:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  // Optimized calendar generation
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      // Fast date matching
      let dateInfo = null;
      if (upcomingDates && !datesLoading) {
        dateInfo = upcomingDates.find(d => {
          if (!d.date) return false;
          try {
            const scheduledDateStr = new Date(d.date).toISOString().split('T')[0];
            return scheduledDateStr === currentDateStr;
          } catch {
            return false;
          }
        });
      }
      
      dates.push({
        date: currentDate.getDate(),
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        active: !!dateInfo,
        dateInfo,
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
    if (!profileId || !recentPlayerCards) return undefined;
    return recentPlayerCards.find(p => p.id === profileId)?.name;
  }, [recentPlayerCards]);

  const handleDataRefresh = useCallback(async () => {
    await refetchDates();
  }, [refetchDates]);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <SubscriptionBanner />
        
        {/* Performance indicator header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Hub Dashboard</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Zap className="text-yellow-400" size={16} />
                <span className="text-yellow-400 text-sm font-medium">
                  Lightning Mode: {playersLoadTime}ms {playersCacheHit ? '(cached)' : '(fresh)'}
                </span>
              </div>
              {!optimizationComplete && (
                <span className="text-blue-400 text-sm animate-pulse">
                  🔄 Optimizing... {optimizationProgress}%
                </span>
              )}
            </div>
          </div>
        </div>

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
            
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-2 lg:p-4 rounded-lg text-center transition-all duration-200 ${
                    date.active 
                      ? 'bg-green-500 text-black shadow-lg cursor-pointer hover:bg-green-400 transform hover:scale-105'
                      : date.isLoading 
                        ? 'bg-gray-800 text-gray-300 animate-pulse cursor-default'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-default'
                  }`}
                  onClick={() => handleDateClick(date.dateInfo)}
                >
                  <div className="text-xs font-medium mb-1">{date.day}</div>
                  <div className="text-sm lg:text-lg font-bold">{date.date}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Active Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Recently Active</h2>
            
            {playersLoading ? (
              <div className="flex justify-start space-x-3">
                <LoadingSpinner text="Loading recent players..." />
              </div>
            ) : (
              <>
                <div className="flex justify-start space-x-3 overflow-x-auto pb-2 px-1">
                  {recentPlayerCards?.map((player) => (
                    <div key={player.id} className="relative">
                      <PlayerCard 
                        player={{
                          id: player.id,
                          name: player.name,
                          avatar: player.image_url || '',
                          status: player.status,
                        }}
                        onClick={() => handlePlayerSelect(player.id, player.name)}
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
                {(!recentPlayerCards || recentPlayerCards.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    No recently active players
                  </div>
                )}
              </>
            )}
          </section>
        </div>
        
        {/* Chat Analysis Section */}
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
        onDateAdded={handleDataRefresh}
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

export default LightningHubScreen;