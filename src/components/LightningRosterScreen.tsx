/**
 * Lightning-Fast Roster Screen
 * 
 * PERFORMANCE TARGETS:
 * - Initial display: <200ms
 * - Player selection: <100ms (cached) or <500ms (fresh)
 * - Search filtering: <50ms
 */

import React, { useState, memo, useCallback, useMemo } from 'react';
import { Users, Plus, Zap } from 'lucide-react';
import SearchBar from './SearchBar';
import PlayerCard from './PlayerCard';
import AddPlayerModal from './AddPlayerModal';
import LoadingSpinner from './LoadingSpinner';
import { usePlayerCards, useLightningOptimization } from '../hooks/useLightningLoader';
import { lightningService } from '../services/lightningService';
import type { PlayerComplete } from '../services/lightningService';

interface LightningRosterScreenProps {
  onPlayerSelect: (player: PlayerComplete) => void;
}

const LightningRosterScreen = memo(function LightningRosterScreen({ onPlayerSelect }: LightningRosterScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Lightning-fast player cards loading
  const { data: playerCards, loading, error, loadTime, cacheHit, refetch } = usePlayerCards();
  const { optimizationComplete, optimizationProgress } = useLightningOptimization();

  // Instant filtering with memoization
  const { activePlayers, benchPlayers } = useMemo(() => {
    if (!playerCards) return { activePlayers: [], benchPlayers: [] };
    
    const searchLower = searchQuery.toLowerCase();
    const filtered = searchQuery 
      ? playerCards.filter(player => player.name.toLowerCase().includes(searchLower))
      : playerCards;
    
    return {
      activePlayers: filtered.filter(player => !player.bench),
      benchPlayers: filtered.filter(player => player.bench)
    };
  }, [playerCards, searchQuery]);

  // Lightning-fast player selection
  const handlePlayerSelect = useCallback(async (playerId: string, playerName: string) => {
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

  // Show ultra-fast loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Zap className="text-yellow-400 animate-pulse" size={24} />
              <span className="text-white font-medium">Lightning Mode Active</span>
            </div>
            <LoadingSpinner 
              variant="detailed" 
              text="Loading roster at lightning speed..."
            />
            {optimizationProgress > 0 && (
              <div className="mt-4">
                <div className="w-64 bg-gray-800 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${optimizationProgress}%` }}
                  />
                </div>
                <p className="text-yellow-400 text-sm mt-2">Optimizing performance... {optimizationProgress}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border-2 border-red-500 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Failed to Load Roster</h2>
            <p className="text-red-300 mb-6">{error.message}</p>
            <button 
              onClick={refetch}
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
        {/* Performance indicator header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Player Roster</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Zap className="text-yellow-400" size={16} />
                <span className="text-yellow-400 text-sm font-medium">
                  Loaded in {loadTime}ms {cacheHit ? '(cached)' : '(fresh)'}
                </span>
              </div>
              {!optimizationComplete && (
                <span className="text-blue-400 text-sm animate-pulse">
                  🔄 Optimizing in background...
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowAddPlayerModal(true)}
              className="bg-green-500 hover:bg-green-600 px-3 lg:px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="text-black" size={20} />
              <span className="text-black font-medium hidden sm:inline">Add Player</span>
            </button>
            <div className="bg-gray-900 p-2 rounded-lg">
              <Users className="text-gray-400" size={24} />
            </div>
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
              Active Players ({activePlayers.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {activePlayers.map((player) => (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    player={{
                      id: player.id,
                      name: player.name,
                      avatar: player.image_url || '',
                      status: player.status,
                      isActive: !player.bench
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
            {activePlayers.length === 0 && (
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
              Bench ({benchPlayers.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {benchPlayers.map((player) => (
                <div key={player.id} className="relative">
                  <PlayerCard 
                    player={{
                      id: player.id,
                      name: player.name,
                      avatar: player.image_url || '',
                      status: player.status,
                      isActive: !player.bench
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
            {benchPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'No bench players match your search' : 'No players on the bench'}
              </div>
            )}
          </section>
        </div>

        {/* Performance debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">⚡ Lightning Performance Stats</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <p>Load Time: {loadTime}ms {cacheHit ? '(Cache Hit)' : '(Fresh Data)'}</p>
              <p>Optimization: {optimizationComplete ? 'Complete' : `${optimizationProgress}%`}</p>
              <p>Active Players: {activePlayers.length}</p>
              <p>Bench Players: {benchPlayers.length}</p>
              <p>Cache Stats: {JSON.stringify(lightningService.getPerformanceStats().cache)}</p>
            </div>
          </div>
        )}
      </div>

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={refetch}
      />
    </div>
  );
});

export default LightningRosterScreen;