import React, { useState, useEffect, memo, useCallback } from 'react';
import { Users, Plus, User } from 'lucide-react';
import SearchBar from './SearchBar';
import AddPlayerModal from './AddPlayerModal';
import { fastPlayerService, type PlayerBasic, type PlayerWithStats } from '../services/fastPlayerService';

interface FastRosterScreenProps {
  onPlayerSelect: (player: PlayerWithStats) => void;
}

const FastRosterScreen = memo(function FastRosterScreen({ onPlayerSelect }: FastRosterScreenProps) {
  const [basicPlayers, setBasicPlayers] = useState<PlayerBasic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Load basic data immediately
  useEffect(() => {
    loadBasicPlayers();
  }, []);

  const loadBasicPlayers = async () => {
    try {
      // Check if we already have cached data first
      const cachedPlayers = await fastPlayerService.getPlayersBasic();
      if (cachedPlayers && cachedPlayers.length > 0) {
        console.log('⚡ Using cached roster data - instant load!');
        setBasicPlayers(cachedPlayers);
        setLoading(false);
        return;
      }
      
      console.log('🚀 Loading basic players for instant display...');
      setLoading(true);
      
      const players = await fastPlayerService.getPlayersBasic();
      setBasicPlayers(players);
      
      console.log('⚡ Basic players loaded instantly:', players.length);
    } catch (error) {
      console.error('❌ Error loading basic players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle player selection - load full data on demand
  const handlePlayerSelect = useCallback(async (player: PlayerBasic) => {
    setLoadingPlayerDetails(player.id);
    
    try {
      console.log('🔍 Loading full stats for:', player.name);
      const playerWithStats = await fastPlayerService.getPlayerWithStats(player.id);
      onPlayerSelect(playerWithStats);
    } catch (error) {
      console.error('❌ Error loading player stats:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  // Filter players
  const filteredPlayers = React.useMemo(() => {
    const filtered = searchQuery 
      ? basicPlayers.filter(player => 
          player.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : basicPlayers;
    
    return {
      active: filtered.filter(player => !player.bench),
      bench: filtered.filter(player => player.bench)
    };
  }, [basicPlayers, searchQuery]);

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Player Roster</h1>
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading roster...</p>
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
          {/* Active Players */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibent text-white mb-6">
              Active Players ({filteredPlayers.active.length})
            </h2>
            <div className="flex space-x-3 overflow-x-auto pb-4">
              {filteredPlayers.active.map((player) => (
                <div key={player.id} className="relative">
                  <div
                    onClick={() => handlePlayerSelect(player)}
                    className={`w-36 bg-black border-2 border-green-500 rounded-xl overflow-hidden transition-all duration-200 shadow-lg flex-shrink-0 ${
                      loadingPlayerDetails === player.id
                        ? 'cursor-wait opacity-75' 
                        : 'cursor-pointer hover:bg-green-900/50 hover:border-green-400'
                    }`}
                  >
                    {/* Image */}
                    <div className="h-28 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      {player.image_url ? (
                        <img 
                          src={player.image_url} 
                          alt={player.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="text-white" size={24} />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-2">
                      <h3 className="text-white font-semibold text-center mb-1 truncate text-xs">
                        {player.name}
                      </h3>
                      
                      {player.status && (
                        <div className="flex justify-center">
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
                  
                  {/* Loading overlay */}
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
            
            {filteredPlayers.active.length === 0 && (
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

          {/* Bench Players */}
          <section className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibent text-white mb-6">
              Bench ({filteredPlayers.bench.length})
            </h2>
            <div className="flex space-x-3 overflow-x-auto pb-4">
              {filteredPlayers.bench.map((player) => (
                <div key={player.id} className="relative">
                  <div
                    onClick={() => handlePlayerSelect(player)}
                    className={`w-36 bg-black border-2 border-green-500 rounded-xl overflow-hidden transition-all duration-200 shadow-lg flex-shrink-0 opacity-75 ${
                      loadingPlayerDetails === player.id
                        ? 'cursor-wait' 
                        : 'cursor-pointer hover:bg-green-900/50 hover:border-green-400'
                    }`}
                  >
                    {/* Image */}
                    <div className="h-28 w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                      {player.image_url ? (
                        <img 
                          src={player.image_url} 
                          alt={player.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="text-white" size={24} />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-2">
                      <h3 className="text-white font-semibold text-center mb-1 truncate text-xs">
                        {player.name}
                      </h3>
                      
                      {player.status && (
                        <div className="flex justify-center">
                          <span className="bg-gray-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            {player.status === 'side_piece' ? '🍑' : 
                             player.status === 'wifey' ? '💍' : 
                             player.status === 'dating' ? '❤️' : 
                             player.status === 'situationship' ? '🤷‍♀️' : '👀'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Loading overlay */}
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
            
            {filteredPlayers.bench.length === 0 && (
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
        onPlayerAdded={() => {
          fastPlayerService.clearCache();
          loadBasicPlayers();
        }}
      />
    </div>
  );
});

export default FastRosterScreen;