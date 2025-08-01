import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import PlayerCard from './PlayerCard';
import AddDateModal from './AddDateModal';
import UpcomingDateModal from './UpcomingDateModal';
import ChatAnalysisModal from './ChatAnalysisModal';
import SubscriptionBanner from './SubscriptionBanner';
import { datesApi, playerApi, meetingsApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;
type UpcomingDate = Tables<'upcoming_dates'>;

interface HubScreenProps {
  onPlayerSelect?: (player: Player) => void;
}

export default function HubScreen({ onPlayerSelect }: HubScreenProps) {
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showDateInfoModal, setShowDateInfoModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<UpcomingDate | null>(null);
  const [showChatAnalysis, setShowChatAnalysis] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dates, players] = await Promise.all([
        datesApi.getUpcomingDates(),
        playerApi.getRecentlyActive(3),
      ]);
      setUpcomingDates(dates || []);
      setRecentlyActive(players || []);
    } catch (error) {
      console.error('Error loading hub data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar dates for the next 7 days
  const getUpcomingCalendarDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateInfo = upcomingDates.find(d => {
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
  };

  const handleDateClick = (dateInfo: UpcomingDate | null) => {
    if (dateInfo) {
      setSelectedDate(dateInfo);
      setShowDateInfoModal(true);
    }
  };

  const getPlayerName = (profileId: string | null) => {
    if (!profileId) return undefined;
    const player = recentlyActive.find(p => p.id === profileId);
    return player?.name;
  };

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center text-white">Loading...</div>
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
            <div className="flex justify-center space-x-3 lg:space-x-6 overflow-x-auto pb-2">
              {recentlyActive.map((player) => (
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
            {recentlyActive.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No recently active players
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
}