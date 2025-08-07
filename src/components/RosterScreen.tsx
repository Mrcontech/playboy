import React, { useState, memo, useCallback } from 'react';
import { Users, Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import PlayerCard from './PlayerCard';
import AddPlayerModal from './AddPlayerModal';
import LoadingSpinner from './LoadingSpinner';
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
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Load only basic player data initially for faster performance
  const { 
    data: basicPlayers, 
    loading: basicLoading,
    refetch: refetchBasic 
  } = useDataLoader({
    key: 'getPlayersBasic',
    fetcher: () => playerApi.getPlayersBasic(),
    ttlMinutes: 30 // Balanced cache time for basic data
  });

  const loading = basicLoading;

  const loadPlayers = useCallback(async () => {
    try {
      console.log('Refreshing player data...');
      await refetchBasic();
      console.log('Player data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing players:', error);
    }
  }, [refetchBasic]);

  // Handle player selection with lazy loading of detailed data
  const handlePlayerSelect = useCallback(async (player: Partial<Player>) => {
    if (!player.id) return;
    
    setLoadingPlayerDetails(player.id);
    try {
      console.log('🔍 Loading detailed data for:', player.name);
      const detailedPlayer = await playerApi.getPlayerDetails(player.id);
      console.log('✅ Detailed data loaded, navigating to profile');
      onPlayerSelect(detailedPlayer);
    } catch (error) {
      console.error('❌ Error loading player details:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  // Separate active and bench players from basic data
  const { activePlayers, benchPlayers } = React.useMemo(() => {
    const players = basicPlayers || [];
    return {
      activePlayers: players.filter(player => !player.bench),
      benchPlayers: players.filter(player => player.bench)
    };
  }, [basicPlayers]);

  // Memoized filtered players for better performance
  const filteredActivePlayers = React.useMemo(() => activePlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [activePlayers, searchQuery]);

  const filteredBenchPlayers = React.useMemo(() => benchPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  ), [benchPlayers, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h1 className="text-3xl font-bold text-white">Player Roster</h1>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-800 px-4 py-2 rounded-lg animate-pulse">
                <div className="w-20 h-6 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 lg:mb-8">
            <div className="bg-gray-800 rounded-xl p-3 animate-pulse">
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
            {/* Active Players Skeleton */}
            <section className="bg-black border-2 border-green-500 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Active Players</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-36 bg-gray-800 rounded-xl animate-pulse">
                    <div className="h-28 bg-gray-700 rounded-t-xl"></div>
                    <div className="p-2 space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Bench Players Skeleton */}
            <section className="bg-black border-2 border-green-500 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Bench</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-36 bg-gray-800 rounded-xl animate-pulse">
                    <div className="h-28 bg-gray-700 rounded-t-xl"></div>
                    <div className="p-2 space-y-2">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
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
                <div key={player.id} className="relative">
                  <PlayerCard 
                    key={player.id}
                    player={{
                      id: player.id!,
                      name: player.name!,
                      avatar: player.image_url || '',
                      status: player.status,
                      // Show placeholder values for stats that will load on-demand
                      totalMeetings: 0,
                      cpn: 0,
                      averageRating: player.looks_rating || 0,
                      isActive: !player.bench
                    }}
                    onClick={() => handlePlayerSelect(player)}
                    size="small"
                    isLoading={loadingPlayerDetails === player.id}
                  />
                  {loadingPlayerDetails === player.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl flex items-center justify-center">
                      <LoadingSpinner size="small" text="Loading..." />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredActivePlayers.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  {searchQuery ? 'No players match your search' : 'No active players found'}
                </div>
                {!searchQuery && (
                  <button 
                    onClick={() => setShowAddPlayerModal(true)}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-black font-medium transition-colors"
                  >
                    Add Your First Player
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Bench Players Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Bench</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredBenchPlayers.map((player) => (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    key={player.id}
                    player={{
                      id: player.id!,
                      name: player.name!,
                      avatar: player.image_url || '',
                      status: player.status,
                      // Show placeholder values for stats that will load on-demand
                      totalMeetings: 0,
                      cpn: 0,
                      averageRating: player.looks_rating || 0,
                      isActive: !player.bench
                    }}
                    onClick={() => handlePlayerSelect(player)}
                    size="small"
                    isLoading={loadingPlayerDetails === player.id}
                  />
                  {loadingPlayerDetails === player.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 rounded-xl flex items-center justify-center">
                      <LoadingSpinner size="small" text="Loading..." />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredBenchPlayers.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'No bench players match your search' : 'No players on the bench'}
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
                  key={player.id}
                  player={{
                    id: player.id,
                    name: player.name,
                    avatar: player.image_url || '',
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
                    avatar: player.image_url || '',
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