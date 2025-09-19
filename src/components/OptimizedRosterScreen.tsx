import React, { useState, memo, useCallback } from 'react';
import { Users, Plus } from 'lucide-react';
import SearchBar from './SearchBar';
import PlayerCard from './PlayerCard';
import AddPlayerModal from './AddPlayerModal';
import LoadingSpinner from './LoadingSpinner';
import { useOptimizedPlayerLoader } from '../hooks/useOptimizedLoader';
import type { PlayerComplete } from '../services/optimizedPlayerService';

interface OptimizedRosterScreenProps {
  onPlayerSelect: (player: PlayerComplete) => void;
}

const OptimizedRosterScreen = memo(function OptimizedRosterScreen({ onPlayerSelect }: OptimizedRosterScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  const {
    activePlayers,
    benchPlayers,
    loading,
    error,
    getPlayerComplete,
    backgroundLoading,
    refresh,
    getCacheStats
  } = useOptimizedPlayerLoader();

  // Handle player selection with TIER 2 loading
  const handlePlayerSelect = useCallback(async (playerId: string, playerName: string) => {
    setLoadingPlayerDetails(playerId);
    
    try {
      console.log('🔍 TIER 2: Loading complete data for:', playerName);
      const completePlayer = await getPlayerComplete(playerId);
      console.log('✅ TIER 2: Complete data loaded, navigating to profile');
      onPlayerSelect(completePlayer);
    } catch (error) {
      console.error('❌ TIER 2: Error loading complete player data:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [getPlayerComplete, onPlayerSelect]);

  // Filter players based on search
  const filteredActivePlayers = React.useMemo(() => 
    activePlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [activePlayers, searchQuery]);

  const filteredBenchPlayers = React.useMemo(() => 
    benchPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [benchPlayers, searchQuery]);

  // Show loading state for initial load
  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner 
            variant="detailed" 
            text="Loading your roster..."
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border-2 border-red-500 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Failed to Load Roster</h2>
            <p className="text-red-300 mb-6">{error.message}</p>
            <button 
              onClick={refresh}
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
      <div className="max-w-6xl mx-auto">
        {/* Header with performance indicator */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Player Roster</h1>
            {backgroundLoading && (
              <p className="text-green-400 text-sm mt-1 animate-pulse">
                🔄 Optimizing performance in background...
              </p>
            )}
          </div>
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
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* Active Players Section */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Active Players ({filteredActivePlayers.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredActivePlayers.map((player) => (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    player={{
                      id: player.id,
                      name: player.name,
                      avatar: player.image_url || '',
                      status: player.status,
                      isActive: !player.bench,
                      averageRating: player.averageRating,
                      looksRating: player.looks_rating // pass looks rating
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
            {filteredActivePlayers.length === 0 && (
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
            <h2 className="text-2xl font-semibold text-white mb-6">
              Bench ({filteredBenchPlayers.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredBenchPlayers.map((player) => (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    player={{
                      id: player.id,
                      name: player.name,
                      avatar: player.image_url || '',
                      status: player.status,
                      isActive: !player.bench,
                      averageRating: player.averageRating,
                      looksRating: player.looks_rating // pass looks rating
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
            {filteredBenchPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'No bench players match your search' : 'No players on the bench'}
              </div>
            )}
          </section>
        </div>

        {/* Performance Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Performance Stats</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Cache Stats: {JSON.stringify(getCacheStats())}</p>
              <p>Background Loading: {backgroundLoading ? 'Active' : 'Complete'}</p>
              <p>Active Players: {activePlayers.length}</p>
              <p>Bench Players: {benchPlayers.length}</p>
            </div>
          </div>
        )}
      </div>

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={refresh}
      />
    </div>
  );
});

export default OptimizedRosterScreen;