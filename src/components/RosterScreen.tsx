import React, { useState, memo, useCallback } from 'react';
import { Users, Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import PlayerCard from './PlayerCard';
import AddPlayerModal from './AddPlayerModal';
import { useDataLoader } from '../hooks/useDataLoader';
import { playerApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;

interface RosterScreenProps {
  onPlayerSelect: (player: Player) => void;
}

const RosterScreen = memo(function RosterScreen({ onPlayerSelect }: RosterScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Load data with persistent caching
  const { 
    data: activePlayers, 
    loading: activeLoading, 
    refetch: refetchActive 
  } = useDataLoader({
    key: 'getActivePlayers',
    fetcher: () => playerApi.getActivePlayers(),
    ttlMinutes: 30
  });

  const { 
    data: benchPlayers, 
    loading: benchLoading 
  } = useDataLoader({
    key: 'getBenchPlayers',
    fetcher: () => playerApi.getBenchPlayers(),
    ttlMinutes: 30
  });

  const loading = activeLoading || benchLoading;

  const loadPlayers = useCallback(async () => {
    try {
      console.log('Refreshing player data...');
      await refetchActive();
      console.log('Player data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing players:', error);
    }
  }, [refetchActive]);

  const filteredActivePlayers = (activePlayers || []).filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBenchPlayers = (benchPlayers || []).filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center text-white">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h1 className="text-3xl font-bold text-white">Player Roster</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowAddPlayerModal(true)}
              className="bg-green-500 hover:bg-green-600 px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="text-black" size={20} />
              <span className="text-black font-medium hidden sm:inline">Add Player</span>
            </button>
            <button className="bg-gray-900 hover:bg-gray-800 p-2 rounded-lg transition-colors">
              <Users className="text-gray-400" size={24} />
            </button>
          </div>
        </div>

        <div className="mb-6 lg:mb-8">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search roster..."
            onSort={() => {}}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* Active Players Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Active Players</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredActivePlayers.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={{
                    id: player.id,
                    name: player.name,
                    avatar: player.image_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
                    status: player.status,
                    totalMeetings: player.totalMeetings || 0,
                    cpn: player.cpn || 0,
                    averageRating: player.averageRating || 0,
                    isActive: !player.bench
                  }}
                  onClick={() => onPlayerSelect(player)}
                  size="small"
                />
              ))}
            </div>
            {filteredActivePlayers.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">No active players found</div>
                <button 
                  onClick={() => setShowAddPlayerModal(true)}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-black font-medium transition-colors"
                >
                  Add Your First Player
                </button>
              </div>
            )}
          </section>

          {/* Bench Players Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Bench</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredBenchPlayers.map((player) => (
                <PlayerCard 
                  key={player.id}
                  player={{
                    id: player.id,
                    name: player.name,
                    avatar: player.image_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
                    status: player.status,
                    totalMeetings: player.totalMeetings || 0,
                    cpn: player.cpn || 0,
                    averageRating: player.averageRating || 0,
                    isActive: !player.bench
                  }}
                  onClick={() => onPlayerSelect(player)}
                  size="small"
                />
              ))}
            </div>
            {filteredBenchPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No players on the bench
              </div>
            )}
          </section>
        </div>
      </div>

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={loadPlayers}
      />
    </div>
  );
});

export default RosterScreen;