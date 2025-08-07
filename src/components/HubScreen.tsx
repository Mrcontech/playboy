import React, { memo, useCallback } from 'react';
import { useState } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import PlayerCard from './PlayerCard';
import LoadingSpinner from './LoadingSpinner';
import AddDateModal from './AddDateModal';
import UpcomingDateModal from './UpcomingDateModal';
import ChatAnalysisModal from './ChatAnalysisModal';
import SubscriptionBanner from './SubscriptionBanner';
import { useDataLoader } from '../hooks/useDataLoader';
import { datesApi, playerApi } from '../services/api';
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

  // Load data with persistent caching
  const { 
    data: upcomingDates, 
    loading: datesLoading,
    error: datesError,
    refetch: refetchDates 
  } = useDataLoader({
    key: 'getUpcomingDates',
    fetcher: () => datesApi.getUpcomingDates(),
    ttlMinutes: 10 // Increase cache time for better performance
  });

  const { 
    data: recentlyActive, 
    loading: playersLoading,
    error: playersError
  } = useDataLoader({
    key: 'getRecentPlayers_3',
    fetcher: () => playerApi.getRecentPlayers(3),
    ttlMinutes: 15 // Increase cache time slightly
  });

  const loading = datesLoading || playersLoading;

  const loadData = useCallback(async () => {
    await refetchDates();
  }, [refetchDates]);

  // Generate calendar dates for the next 7 days
  const getUpcomingCalendarDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateInfo = upcomingDates?.find(d => {
        const scheduledDate = new Date(d.date);
        return scheduledDate.toDateString() === date.toDateString();
      });
      
      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        active: !!dateInfo,
        dateInfo: dateInfo || null,
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
    const player = recentlyActive?.find(p => p.id === profileId);
    return player?.name;
  }, [recentlyActive]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <LoadingSpinner variant="detailed" text="Loading your hub dashboard" />
      </div>
    );
  }

  const calendarDates = getUpcomingCalendarDates();

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
            
            <div className="grid grid-cols-7 gap-2">
              {calendarDates.map((date, index) => (
                <div
                  key={index}
                  className={`p-2 lg:p-4 rounded-lg text-center transition-colors ${
                    date.active 
                      ? 'bg-green-500 text-black shadow-lg cursor-pointer hover:bg-green-400'
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
            <div className="flex justify-start space-x-3 overflow-x-auto pb-2 px-1">
              {recentlyActive?.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={{
                    id: player.id,
                    name: player.name,
                    avatar: player.image_url || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
                    totalMeetings: player.totalMeetings || 0,
                    cpn: player.cpn || 0,
                    averageRating: player.averageRating || 0,
                    status: player.status,
                  }}
                  onClick={() => onPlayerSelect?.(player)}
                  size="small"
                />
              ))}
            </div>
            {(!recentlyActive || recentlyActive.length === 0) && !playersLoading && !playersError && (
              <div className="text-center py-8 text-gray-400">
                No recently active players
              </div>
            )}
            {(playersLoading || playersError) && (
              <div className="text-center py-8 text-gray-400">
                {playersLoading ? 'Loading players...' : 'Error loading players'}
              </div>
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