import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Plus, MessageCircle, User } from 'lucide-react';
import AddDateModal from './AddDateModal';
import UpcomingDateModal from './UpcomingDateModal';
import ChatAnalysisModal from './ChatAnalysisModal';
import SubscriptionBanner from './SubscriptionBanner';
import { fastPlayerService, type PlayerBasic, type PlayerWithStats } from '../services/fastPlayerService';
import { datesApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type UpcomingDate = Tables<'upcoming_dates'>;

interface FastHubScreenProps {
  onPlayerSelect?: (player: PlayerWithStats) => void;
}

const FastHubScreen = memo(function FastHubScreen({ onPlayerSelect }: FastHubScreenProps) {
  const [recentPlayers, setRecentPlayers] = useState<PlayerBasic[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<UpcomingDate | null>(null);
  const [showChatAnalysis, setShowChatAnalysis] = useState(false);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(true);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);
    loadHubData();
  }, []);

  const loadHubData = async () => {
    try {
      console.log('🏠 Loading Hub data...');
      
      // Load both in parallel for speed
      const [playersResult, datesResult] = await Promise.allSettled([
        fastPlayerService.getRecentPlayersBasic(3),
        datesApi.getUpcomingDates()
      ]);

      if (playersResult.status === 'fulfilled') {
        setRecentPlayers(playersResult.value);
        console.log('✅ Recent players loaded for Hub:', playersResult.value.length);
      } else {
        console.error('Failed to load recent players:', playersResult.reason);
      }

      if (datesResult.status === 'fulfilled') {
        setUpcomingDates(datesResult.value);
        console.log('✅ Upcoming dates loaded for Hub:', datesResult.value.length);
      } else {
        console.error('Failed to load upcoming dates:', datesResult.reason);
      }
    } catch (error) {
      console.error('Error loading hub data:', error);
    } finally {
      setPlayersLoading(false);
      setDatesLoading(false);
    }
  };

  // Handle player selection with full data loading
  const handlePlayerSelect = useCallback(async (player: PlayerBasic) => {
    if (!onPlayerSelect) return;
    
    setLoadingPlayerDetails(player.id);
    try {
      console.log('🔍 Loading full data for:', player.name);
      const playerWithStats = await fastPlayerService.getPlayerWithStats(player.id);
      onPlayerSelect(playerWithStats);
    } catch (error) {
      console.error('❌ Error loading player details:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  // Generate calendar dates
  const calendarDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      
      const currentDateStr = currentDate.toISOString().split('T')[0];
      
      const dateInfo = upcomingDates.find(d => {
        if (!d.date) return false;
        try {
          const scheduledDateStr = new Date(d.date).toISOString().split('T')[0];
          return scheduledDateStr === currentDateStr;
        } catch {
          return false;
        }
      });
      
      dates.push({
        date: currentDate.getDate(),
        day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        active: !!dateInfo,
        dateInfo
      });
    }
    
    return dates;
  }, [upcomingDates]);

  const handleDateClick = useCallback((dateInfo: UpcomingDate | null) => {
    if (dateInfo) {
      setSelectedDate(dateInfo);
      setShowDateInfoModal(true);
    }
  }, []);

  const getPlayerName = useCallback((profileId: string | null) => {
    if (!profileId) return undefined;
    return recentPlayers.find(p => p.id === profileId)?.name;
  }, [recentPlayers]);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <SubscriptionBanner />
        
        <h1 className="text-3xl font-bold text-white mb-8">Hub Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-8">
          {/* Upcoming Dates */}
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
                  className={`p-2 lg:p-4 rounded-lg text-center transition-all duration-300 ${
                    date.active 
                      ? 'bg-green-500 text-black shadow-lg cursor-pointer hover:bg-green-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleDateClick(date.dateInfo)}
                >
                  <div className="text-xs font-medium mb-1">{date.day}</div>
                  <div className="text-sm lg:text-lg font-bold">{date.date}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Active */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Recently Active</h2>
            
            {playersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading players...</p>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto">
                {recentPlayers.map((player) => (
                  <div key={player.id} className="relative">
                    <div
                      onClick={() => handlePlayerSelect(player)}
                      className={`flex-shrink-0 w-36 bg-black border-2 border-green-500 rounded-xl overflow-hidden transition-all duration-200 ${
                        loadingPlayerDetails === player.id
                          ? 'cursor-wait opacity-75' 
                          : 'cursor-pointer hover:border-green-400 hover:scale-105'
                      }`}
                    >
                      <div className="h-28 w-full bg-gray-800 flex items-center justify-center">
                        {player.image_url ? (
                          <img 
                            src={player.image_url} 
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="text-gray-400" size={24} />
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="text-white font-semibold text-center text-xs truncate">
                          {player.name}
                        </h3>
                        {player.status && (
                          <div className="text-center mt-1">
                            <span className="bg-green-500 text-black px-2 py-0.5 rounded-full text-xs font-medium">
                              {player.status === 'side_piece' ? '🍑' : 
                               player.status === 'wifey' ? '💍' : 
                               player.status === 'dating' ? '❤️' : 
                               player.status === 'situationship' ? '🤷‍♀️' : '👀'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {loadingPlayerDetails === player.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-white text-xs">Loading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!playersLoading && recentPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No recently active players
              </div>
            )}
          </section>
        </div>
        
        {/* Chat Analysis */}
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
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Chat Screenshot</h3>
              <p className="text-gray-400 text-sm mb-4">Get AI insights on your conversations</p>
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
        onDateAdded={loadHubData}
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

export default FastHubScreen;