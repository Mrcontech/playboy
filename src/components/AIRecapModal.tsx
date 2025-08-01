import React from 'react';
import { X, Loader2 } from 'lucide-react';
import StarRating from './StarRating';
import { generateAIRecap, type PlayerData } from '../lib/openai';
import type { Tables } from '../lib/supabase';

type Meeting = Tables<'meetings'>;

interface Player {
  id: string;
  name: string;
  image_url?: string;
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  status?: string;
  looks_rating?: number;
}

interface PlayerStats {
  totalSpent: number;
  totalMeetings: number;
  averageRating: number;
  performanceRating: number;
}

interface AIRecapModalProps {
  player: Player;
  playerStats: PlayerStats;
  meetings: Meeting[];
  onClose: () => void;
}

export default function AIRecapModal({ player, playerStats, meetings, onClose }: AIRecapModalProps) {
  const [aiRecap, setAiRecap] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const generateRecap = async () => {
      setLoading(true);
      try {
        const playerData: PlayerData = {
          name: player.name,
          likes: player.likes,
          dislikes: player.dislikes,
          notes: player.notes,
          status: player.status,
          meetings: meetings.map(meeting => ({
            type: meeting.type,
            amount_spent: meeting.amount_spent ? Number(meeting.amount_spent) : undefined,
            base: meeting.base || undefined,
            rating: meeting.rating || undefined,
            performance_rating: meeting.performance_rating || undefined,
            notes: meeting.notes || undefined,
            date: meeting.date || meeting.created_at,
          })),
          totalSpent: playerStats.totalSpent,
          totalMeetings: playerStats.totalMeetings,
          averageRating: playerStats.averageRating,
        };

        const recap = await generateAIRecap(playerData);
        setAiRecap(recap);
      } catch (error) {
        console.error('Error generating AI recap:', error);
        setAiRecap(`Unable to generate AI recap for ${player.name}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    generateRecap();
  }, [player, playerStats, meetings]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600">
            <img 
              src={player.image_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400'} 
              alt={player.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-white">{player.name}</h2>
        </div>

        {/* AI Recap */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-blue-400 font-semibold mb-3">AI Recap</h3>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-blue-400 mr-2" size={20} />
              <span className="text-gray-300">Generating AI recap...</span>
            </div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">{aiRecap}</p>
          )}
        </div>

        {/* Ratings */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Looks</span>
            <StarRating rating={player.looks_rating || 0} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Performance</span>
            <StarRating rating={playerStats.performanceRating || 0} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Date</span>
            <StarRating rating={playerStats.averageRating || 0} />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <button 
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}