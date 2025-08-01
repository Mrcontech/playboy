import React, { useState } from 'react';
import { useEffect } from 'react';
import { ArrowLeft, Edit2, DollarSign, Plus, Heart, Star } from 'lucide-react';
import StarRating from './StarRating';
import AIRecapModal from './AIRecapModal';
import EditPlayerModal from './EditPlayerModal';
import AddMeetingModal from './AddMeetingModal';
import AddExpenseModal from './AddExpenseModal';
import { meetingsApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;

interface PlayerStats {
  totalSpent: number;
  totalMeetings: number;
  hookups: number;
  cpn: number;
  averageRating: number;
  performanceRating: number;
  dateRating: number;
}

interface PlayerProfileProps {
  player: Player;
  onBack: () => void;
}

export default function PlayerProfile({ player, onBack }: PlayerProfileProps) {
  const [showAIRecap, setShowAIRecap] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalSpent: 0,
    totalMeetings: 0,
    hookups: 0,
    cpn: 0,
    averageRating: 0,
    performanceRating: 0,
    dateRating: 0,
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerStats();
  }, [player.id]);

  const loadPlayerStats = async () => {
    try {
      const meetings = await meetingsApi.getMeetingsByPlayer(player.id);
      setMeetings(meetings || []);
      
      const totalSpent = meetings?.reduce((sum, meeting) => 
        sum + (Number(meeting.amount_spent) || 0), 0) || 0;
      
      const totalMeetings = meetings?.length || 0;
      
      // Calculate hookups (meetings with performance ratings)
      const hookups = meetings?.filter(meeting => 
        meeting.performance_rating && Number(meeting.performance_rating) > 0).length || 0;
      
      // Calculate CPN based on hookups, not total meetings
      const cpn = hookups > 0 ? totalSpent / hookups : 0;
      
      const ratingsSum = meetings?.reduce((sum, meeting) => 
        sum + (Number(meeting.rating) || 0), 0) || 0;
      const averageRating = totalMeetings > 0 ? ratingsSum / totalMeetings : 0;
      
      const performanceSum = meetings?.reduce((sum, meeting) => 
        sum + (Number(meeting.performance_rating) || 0), 0) || 0;
      const performanceRating = hookups > 0 ? performanceSum / hookups : 0;
      
      setPlayerStats({
        totalSpent,
        totalMeetings,
        hookups,
        cpn,
        averageRating,
        performanceRating,
        dateRating: averageRating, // Using average rating as date rating for now
      });
    } catch (error) {
      console.error('Error loading player stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="bg-gray-800 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="text-white" size={20} />
            <span className="text-white font-medium hidden sm:inline">Back to Roster</span>
          </button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            <button 
              onClick={() => setShowEditModal(true)}
              className="bg-gray-800 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Edit2 className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Edit</span>
            </button>
            <button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-blue-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <DollarSign className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Add Expense</span>
            </button>
            <button 
              onClick={() => setShowAddMeetingModal(true)}
              className="bg-green-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Add Meeting</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            {/* Profile Header */}
            <div className="bg-gray-800 rounded-xl p-6 text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600">
                <img 
                  src={player.image_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-white">{player.name}</h1>
              <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                {player.status || 'Active'}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-xl text-center">
                <Heart className="text-red-400 mx-auto mb-2" size={24} />
                <div className="text-xl font-bold text-white">{playerStats.totalMeetings}</div>
                <div className="text-xs text-gray-400">Meetings</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl text-center">
                <DollarSign className="text-green-400 mx-auto mb-2" size={24} />
                <div className="text-lg font-bold text-white">${Math.round(playerStats.cpn)}</div>
                <div className="text-xs text-gray-400">CPN</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl text-center">
                <Star className="text-blue-400 fill-current mx-auto mb-2" size={24} />
                <div className="text-xl font-bold text-white">{playerStats.averageRating.toFixed(1)}</div>
                <div className="text-xs text-gray-400">Avg</div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Ratings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Performance Ratings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Looks</span>
                  <StarRating rating={player.looks_rating || 0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Performance</span>
                  <StarRating rating={playerStats.performanceRating} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Date Experience</span>
                  <StarRating rating={playerStats.dateRating} />
                </div>
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Profile Details</h3>
                <button 
                  onClick={() => setShowAIRecap(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  AI Recap
                </button>
              </div>
              
              {/* Likes Section */}
              {player.likes && player.likes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-green-400 font-medium mb-3">Likes</h4>
                  <div className="flex flex-wrap gap-2">
                    {player.likes.map((like, index) => (
                      <span key={index} className="bg-green-900/20 text-green-300 px-3 py-1 rounded-full text-sm">
                        {like}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Dislikes Section */}
              {player.dislikes && player.dislikes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-red-400 font-medium mb-3">Dislikes</h4>
                  <div className="flex flex-wrap gap-2">
                    {player.dislikes.map((dislike, index) => (
                      <span key={index} className="bg-red-900/20 text-red-300 px-3 py-1 rounded-full text-sm">
                        {dislike}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes Section */}
              {player.notes && (
                <div className="mb-6">
                  <h4 className="text-blue-400 font-medium mb-3">Notes</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 leading-relaxed">
                      {player.notes}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Fallback message */}
              {(!player.likes || player.likes.length === 0) && 
               (!player.dislikes || player.dislikes.length === 0) && 
               !player.notes && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    {loading ? 'Loading player data...' : 'No additional information available'}
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors">
                    Add Details
                  </button>
                </div>
              )}
            </div>

            {/* Meetings & Expenses History */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Meeting & Expense History</h3>
              {meetings.length > 0 ? (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
                          </span>
                          {meeting.amount_spent && meeting.amount_spent > 0 && (
                            <span className="text-green-400 font-medium">
                              ${Number(meeting.amount_spent).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(meeting.date || meeting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {meeting.base && (
                        <div className="text-gray-300 text-sm mb-2">
                          📍 {meeting.base}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-2">
                        {meeting.rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 text-sm">Experience:</span>
                            <StarRating rating={meeting.rating} maxRating={10} size="small" />
                          </div>
                        )}
                        {meeting.performance_rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 text-sm">Performance 😏:</span>
                            <StarRating rating={meeting.performance_rating} maxRating={10} size="small" />
                          </div>
                        )}
                      </div>
                      
                      {meeting.notes && (
                        <div className="text-gray-300 text-sm bg-gray-600 rounded p-3 mt-2">
                          {meeting.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">No meetings or expenses recorded yet</div>
                  <div className="flex justify-center space-x-4">
                    <button 
                      onClick={() => setShowAddMeetingModal(true)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      Add Meeting
                    </button>
                    <button 
                      onClick={() => setShowAddExpenseModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAIRecap && (
        <AIRecapModal 
          player={player}
          playerStats={playerStats}
          meetings={meetings}
          onClose={() => setShowAIRecap(false)}
        />
      )}

      {showEditModal && (
        <EditPlayerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPlayerUpdated={loadPlayerStats}
          onPlayerDeleted={onBack}
          player={player}
        />
      )}

      {showAddMeetingModal && (
        <AddMeetingModal
          isOpen={showAddMeetingModal}
          onClose={() => setShowAddMeetingModal(false)}
          onMeetingAdded={loadPlayerStats}
          playerId={player.id}
          playerName={player.name}
        />
      )}

      {showAddExpenseModal && (
        <AddExpenseModal
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onExpenseAdded={loadPlayerStats}
          playerId={player.id}
          playerName={player.name}
        />
      )}
    </div>
  );
}