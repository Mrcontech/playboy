import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, DollarSign, Plus, Heart, Star, User, Loader2 } from 'lucide-react';
import StarRating from './StarRating';
import AIRecapModal from './AIRecapModal';
import EditPlayerModal from './EditPlayerModal';
import AddMeetingModal from './AddMeetingModal';
import AddExpenseModal from './AddExpenseModal';
import LoadingSpinner from './LoadingSpinner';
import { fastPlayerService, type PlayerWithStats } from '../services/fastPlayerService';
import { meetingsApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;
type Meeting = Tables<'meetings'>;

interface PlayerProfileProps {
  player: PlayerWithStats;
  onBack: () => void;
}

export default function PlayerProfile({ player, onBack }: PlayerProfileProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIRecap, setShowAIRecap] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, [player.id]);

  const loadMeetings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📅 Loading meetings for player:', player.name);
      
      const data = await meetingsApi.getMeetingsByPlayer(player.id);
      
      setMeetings(data);
      console.log('✅ Meetings loaded:', data.length);
      
    } catch (err) {
      console.error('💥 Error loading meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = async () => {
    // Refresh meetings after updates
    await loadMeetings();
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={onBack}
              className="bg-gray-800 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Back to Roster</span>
            </button>
          </div>
          
          <div className="bg-black border-2 border-green-500 rounded-xl p-8">
            <LoadingSpinner 
              variant="detailed" 
              text={`Loading ${player.name}'s profile...`}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={onBack}
              className="bg-gray-800 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Back to Roster</span>
            </button>
          </div>
          
          <div className="bg-red-900/20 border-2 border-red-500 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Failed to Load Player Details</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button 
              onClick={loadMeetings}
              className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg text-white font-medium transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              className="bg-gray-900 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Edit2 className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Edit</span>
            </button>
            <button 
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-purple-500 px-3 lg:px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <DollarSign className="text-white" size={20} />
              <span className="text-white font-medium hidden sm:inline">Add Expense</span>
            </button>
            <button 
              onClick={() => setShowAddMeetingModal(true)}
              className="bg-green-500 px-3 lg:px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
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
            <div className="bg-black border-2 border-green-500 rounded-xl p-6 text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600">
                {player.image_url ? (
                  <img 
                    src={player.image_url} 
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="text-white" size={48} />
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2 text-white">{player.name}</h1>
              <span className="bg-green-500 text-black px-4 py-2 rounded-full text-sm font-medium">
                {player.status || 'Active'}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-black border-2 border-green-500 p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">📅</div>
                <div className="text-lg font-bold text-white">{player.totalMeetings}</div>
                <div className="text-xs text-gray-400">Meetings</div>
              </div>
              <div className="bg-black border-2 border-green-500 p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-bold text-white">${player.cpn}</div>
                <div className="text-xs text-gray-400">CPN</div>
              </div>
              <div className="bg-black border-2 border-green-500 p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-lg font-bold text-white">{player.averageRating}</div>
                <div className="text-xs text-gray-400">Avg</div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Ratings */}
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">📊 Performance Ratings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium text-sm sm:text-base">👀 Looks</span>
                  <StarRating rating={player.looks_rating || 0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium text-sm sm:text-base">🔥 Performance</span>
                  <StarRating rating={player.performanceRating || 0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium text-sm sm:text-base">💕 Date Experience</span>
                  <StarRating rating={player.dateRating || 0} />
                </div>
              </div>
            </div>

            {/* Profile Details - FIXED SECTION */}
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">📝 Profile Details</h3>
                <button 
                  onClick={() => setShowAIRecap(true)}
                  className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <span>🤖</span>
                  <span>AI Recap</span>
                </button>
              </div>
              
              {/* Likes Section - FIXED */}
              <div className="mb-6">
                <h4 className="text-green-500 font-medium mb-3">👍 Likes</h4>
                {player.likes && player.likes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {player.likes.map((like, index) => (
                      <span key={index} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                        {like}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic bg-gray-800 rounded-lg p-3 border border-gray-700">
                    No likes added yet
                  </div>
                )}
              </div>
              
              {/* Dislikes Section - FIXED */}
              <div className="mb-6">
                <h4 className="text-red-500 font-medium mb-3">👎 Dislikes</h4>
                {player.dislikes && player.dislikes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {player.dislikes.map((dislike, index) => (
                      <span key={index} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/30">
                        {dislike}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic bg-gray-800 rounded-lg p-3 border border-gray-700">
                    No dislikes added yet
                  </div>
                )}
              </div>
              
              {/* Notes Section - FIXED */}
              <div className="mb-6">
                <h4 className="text-purple-500 font-medium mb-3">📋 Notes</h4>
                {player.notes && player.notes.trim() ? (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-gray-300 leading-relaxed">
                      {player.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic bg-gray-800 rounded-lg p-3 border border-gray-700">
                    No notes added yet
                  </div>
                )}
              </div>
              
              {/* Action button */}
              <div className="text-center pt-4 border-t border-gray-700">
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                >
                  {(player.likes?.length || player.dislikes?.length || player.notes?.trim()) 
                    ? 'Edit Details' : 'Add Details'}
                </button>
              </div>
            </div>

            {/* Meetings & Expenses History */}
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">📅 Meeting & Expense History</h3>
              {meetings && meetings.length > 0 ? (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {meeting.type ? meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1) : 'N/A'}
                          </span>
                          {meeting.amount_spent && meeting.amount_spent > 0 && (
                            <span className="text-green-500 font-medium text-sm">
                              ${Number(meeting.amount_spent).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-xs sm:text-sm">
                          {new Date(meeting.date || meeting.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {meeting.base && (
                        <div className="text-gray-300 text-xs sm:text-sm mb-2">
                          📍 {meeting.base}
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
                        {meeting.rating && (
                          <div className="flex items-center space-x-1 flex-wrap">
                            <span className="text-gray-400 text-xs">💕 Experience:</span>
                            <StarRating rating={meeting.rating} maxRating={10} size="small" />
                          </div>
                        )}
                        {meeting.performance_rating && (
                          <div className="flex items-center space-x-1 flex-wrap">
                            <span className="text-gray-400 text-xs">🔥 Performance:</span>
                            <StarRating rating={meeting.performance_rating} maxRating={10} size="small" />
                          </div>
                        )}
                      </div>
                      
                      {meeting.notes && (
                        <div className="text-gray-300 text-xs sm:text-sm bg-gray-700 rounded p-2 sm:p-3 mt-2">
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
                      className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-black font-medium transition-colors"
                    >
                      Add Meeting
                    </button>
                    <button 
                      onClick={() => setShowAddExpenseModal(true)}
                      className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        {showAIRecap && (
          <AIRecapModal 
            player={player}
            playerStats={{
              totalSpent: player.totalSpent,
              totalMeetings: player.totalMeetings,
              averageRating: player.averageRating,
              performanceRating: player.averageRating
            }}
            meetings={meetings}
            onClose={() => setShowAIRecap(false)}
          />
        )}

        {showEditModal && (
          <EditPlayerModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onPlayerUpdated={handleDataUpdate}
            onPlayerDeleted={() => {
              // Clear cache and navigate back immediately
              fastPlayerService.clearCache();
              onBack();
            }}
            player={player}
          />
        )}

        {showAddMeetingModal && (
          <AddMeetingModal
            isOpen={showAddMeetingModal}
            onClose={() => setShowAddMeetingModal(false)}
            onMeetingAdded={handleDataUpdate}
            playerId={player.id}
            playerName={player.name}
          />
        )}

        {showAddExpenseModal && (
          <AddExpenseModal
            isOpen={showAddExpenseModal}
            onClose={() => setShowAddExpenseModal(false)}
            onExpenseAdded={handleDataUpdate}
            playerId={player.id}
            playerName={player.name}
          />
        )}
      </div>
    </div>
  );
}