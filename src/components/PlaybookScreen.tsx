import React, { useState, useEffect, memo, useCallback } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, Target, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useDataLoader } from '../hooks/useDataLoader';
import { statsApi, playerApi } from '../services/api';

interface CPNData {
  period: string;
  cpn: number;
  totalSpent: number;
  hookups: number;
}

interface TopPlayer {
  id: string;
  name: string;
  image_url?: string;
  looks_rating?: number;
  status?: string;
  average_rating: number;
  meeting_count: number;
  totalMeetings?: number;
  cpn?: number;
  averageRating?: number;
}

interface DashboardStats {
  totalSpent: number;
  totalDates: number;
  totalHookups: number;
}

interface PlaybookScreenProps {
  onPlayerSelect: (player: any) => void;
}

const PlaybookScreen = memo(function PlaybookScreen({ onPlayerSelect }: PlaybookScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loadingPlayerDetails, setLoadingPlayerDetails] = useState<string | null>(null);

  // Optimized data loading with parallel fetching
  const { 
    data: cpnData, 
    loading: cpnLoading
  } = useDataLoader({
    key: `getCPNByPeriod_${selectedPeriod}`,
    fetcher: () => statsApi.getCPNByPeriod(selectedPeriod),
    ttlMinutes: 30, // Balanced cache time
    dependencies: [selectedPeriod]
  });

  const { 
    data: topPlayers, 
    loading: playersLoading
  } = useDataLoader({
    key: 'getTopPlayersByRating_3',
    fetcher: () => statsApi.getTopPlayersByRating(3),
    ttlMinutes: 25
  });

  const { 
    data: rawStats, 
    loading: statsLoading
  } = useDataLoader({
    key: 'getDashboardStats',
    fetcher: () => statsApi.getDashboardStats(),
    ttlMinutes: 20
  });

  // Memoized dashboard stats calculation
  const dashboardStats = React.useMemo(() => {
    const stats = rawStats || { totalSpent: 0, totalDates: 0, totalHookups: 0 };
    const averageCPN = stats.totalHookups > 0 ? stats.totalSpent / stats.totalHookups : 0;
    
    return {
      ...stats,
      averageCPN: Math.round(averageCPN)
    };
  }, [rawStats]);

  // Handle player selection with lazy loading for top players
  const handleTopPlayerSelect = useCallback(async (player: TopPlayer) => {
    if (!player?.id) {
      console.error('❌ Player ID is undefined, cannot load details');
      alert('Unable to load player details - invalid player data.');
      return;
    }

    setLoadingPlayerDetails(player.id);
    try {
      console.log('🔍 Loading detailed data for top player:', player.name);
      const detailedPlayer = await playerApi.getPlayerDetails(player.id);
      console.log('✅ Detailed data loaded, navigating to profile');
      onPlayerSelect(detailedPlayer);
    } catch (error) {
      console.error('❌ Error loading top player details:', error);
      alert('Failed to load player details. Please try again.');
    } finally {
      setLoadingPlayerDetails(null);
    }
  }, [onPlayerSelect]);

  const formatPeriodLabel = useCallback((period: string) => {
    if (!period || typeof period !== 'string') {
      return 'N/A';
    }
    
    if (selectedPeriod === 'weekly') {
      return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (selectedPeriod === 'monthly') {
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return period;
    }
  }, [selectedPeriod]);

  const renderChart = useCallback(() => {
    if (!cpnData || cpnData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 size={48} className="mb-4" />
          <p className="text-lg font-medium mb-2">No CPN data available</p>
          <p className="text-sm text-center">Add some meetings with performance ratings to see your CPN trends</p>
        </div>
      );
    }

    const maxCPN = Math.max(...cpnData.map(d => d.cpn));
    const minCPN = 0; // Always start from $0
    const range = maxCPN; // Range from 0 to max
    const padding = maxCPN * 0.1; // Add 10% padding to the top
    const chartHeight = 300;
    const chartWidth = 600;

    return (
      <div className="relative">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * (chartHeight - 40)) - 20;
            const value = ratio * (maxCPN + padding);
            return (
              <g key={index}>
                <line
                  x1={60}
                  y1={y}
                  x2={chartWidth - 40}
                  y2={y}
                  stroke="#374151"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                <text
                  x={50}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-400"
                >
                  ${Math.round(value)}
                </text>
              </g>
            );
          })}

          {/* Chart area background */}
          <rect
            x={60}
            y={20}
            width={chartWidth - 100}
            height={chartHeight - 60}
            fill="#111827"
            rx={8}
          />

          {/* Data line and area */}
          {cpnData.length > 1 && (
            <>
              {/* Area fill */}
              <defs>
                <linearGradient id="cpnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <path
                d={`M ${cpnData.map((d, i) => {
                  const x = 60 + (i * (chartWidth - 100)) / (cpnData.length - 1);
                  const y = chartHeight - 20 - (d.cpn / (maxCPN + padding)) * (chartHeight - 40);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')} L ${60 + (chartWidth - 100)} ${chartHeight - 20} L 60 ${chartHeight - 20} Z`}
                fill="url(#cpnGradient)"
              />

              {/* Line */}
              <path
                d={cpnData.map((d, i) => {
                  const x = 60 + (i * (chartWidth - 100)) / (cpnData.length - 1);
                  const y = chartHeight - 20 - (d.cpn / (maxCPN + padding)) * (chartHeight - 40);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                stroke="#10b981"
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Data points */}
          {cpnData.map((d, i) => {
            const x = 60 + (i * (chartWidth - 100)) / (cpnData.length - 1);
            const y = chartHeight - 20 - (d.cpn / (maxCPN + padding)) * (chartHeight - 40);
            
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={6} fill="#10b981" stroke="#1f2937" strokeWidth={2} />
                <circle cx={x} cy={y} r={3} fill="#ffffff" />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  ${Math.round(d.cpn)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {cpnData.map((d, i) => {
            const x = 60 + (i * (chartWidth - 100)) / (cpnData.length - 1);
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {formatPeriodLabel(d.period)}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }, [cpnData, selectedPeriod, formatPeriodLabel]);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Playbook Analytics</h1>

        {/* Performance Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-black border-2 border-green-500 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gray-700 p-3 rounded-lg w-12 h-12"></div>
                  <div className="bg-gray-700 w-5 h-5 rounded"></div>
                </div>
                <div className="bg-gray-700 h-8 w-24 rounded mb-1"></div>
                <div className="bg-gray-700 h-4 w-16 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <DollarSign className="text-white" size={24} />
                </div>
                <TrendingUp className="text-green-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${dashboardStats.totalSpent.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Total Spent</div>
            </div>

            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Target className="text-white" size={24} />
                </div>
                <TrendingUp className="text-orange-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${dashboardStats.averageCPN.toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">Average CPN</div>
            </div>

            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Calendar className="text-white" size={24} />
                </div>
                <TrendingUp className="text-purple-500" size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {dashboardStats.totalDates}
              </div>
              <div className="text-gray-400 text-sm">Total Dates</div>
            </div>

            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <Users className="text-white" size={24} />
                </div>
                <TrendingUp className="text-purple-400" size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {dashboardStats.totalHookups}
              </div>
              <div className="text-gray-400 text-sm">Total Hookups</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* CPN Chart */}
          {cpnLoading ? (
            <div className="bg-black border-2 border-green-500 rounded-xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-gray-700 h-8 w-48 rounded"></div>
                <div className="bg-gray-700 h-10 w-32 rounded-lg"></div>
              </div>
              <div className="bg-gray-700 h-64 rounded-lg"></div>
            </div>
          ) : (
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Average Cost Per Nut</h2>
                <div className="flex bg-gray-700 rounded-lg p-1 text-xs lg:text-sm">
                  {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-2 lg:px-4 py-2 rounded-md font-medium transition-colors ${
                        period === 'yearly' ? 'hidden' : ''
                      } ${
                        selectedPeriod === period
                          ? 'bg-green-500 text-black'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-black rounded-lg p-2 lg:p-4 overflow-x-auto">
                {renderChart()}
              </div>
            </div>
          )}

          {/* Top Players */}
          {playersLoading ? (
            <div className="bg-black border-2 border-green-500 rounded-xl p-6 animate-pulse">
              <div className="bg-gray-700 h-8 w-48 rounded mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-700 w-8 h-8 rounded-full"></div>
                      <div className="bg-gray-700 w-12 h-12 rounded-full"></div>
                      <div className="flex-1">
                        <div className="bg-gray-700 h-4 w-24 rounded mb-2"></div>
                        <div className="bg-gray-700 h-3 w-16 rounded"></div>
                      </div>
                      <div className="bg-gray-700 h-4 w-12 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-black border-2 border-green-500 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Top Players by Rating</h2>
              <div className="space-y-4">
                {topPlayers && topPlayers.length > 0 ? (
                  topPlayers.map((player, index) => (
                    <div key={player.id} className="relative">
                      <div 
                        className={`bg-black border-2 border-green-500 rounded-lg p-4 transition-colors ${
                          loadingPlayerDetails === player.id 
                            ? 'cursor-wait opacity-75' 
                            : 'hover:border-green-400 cursor-pointer'
                        }`}
                        onClick={() => handleTopPlayerSelect(player)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600">
                            {player.image_url ? (
                              <img 
                                src={player.image_url} 
                                alt={player.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="text-white" size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-sm text-gray-400">{player.meeting_count} meetings</div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-white font-bold">{player.average_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      {loadingPlayerDetails === player.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex items-center justify-center">
                          <LoadingSpinner size="small" text="Loading details..." />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-400 mb-2">No rated players yet</p>
                    <p className="text-sm text-gray-500">Add some meetings with ratings to see your top performers</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PlaybookScreen;