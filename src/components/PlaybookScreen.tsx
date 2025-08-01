import React, { useState, useEffect, memo, useCallback } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, Target } from 'lucide-react';
import { statsApi } from '../services/api';

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
  average_rating: number;
  meeting_count: number;
}

interface DashboardStats {
  totalSpent: number;
  totalDates: number;
  totalHookups: number;
  averageCPN: number;
}

const PlaybookScreen = memo(function PlaybookScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [cpnData, setCpnData] = useState<CPNData[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSpent: 0,
    totalDates: 0,
    totalHookups: 0,
    averageCPN: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cpnResult, playersResult, statsResult] = await Promise.all([
        statsApi.getCPNByPeriod(selectedPeriod),
        statsApi.getTopPlayersByRating(3),
        statsApi.getDashboardStats()
      ]);
      
      setCpnData(cpnResult || []);
      setTopPlayers(playersResult || []);
      
      // Calculate average CPN
      const stats = statsResult || { totalSpent: 0, totalDates: 0, totalHookups: 0 };
      const averageCPN = stats.totalHookups > 0 ? stats.totalSpent / stats.totalHookups : 0;
      
      setDashboardStats({
        ...stats,
        averageCPN: Math.round(averageCPN)
      });
    } catch (error) {
      console.error('Error loading playbook data:', error);
      setCpnData([]);
      setTopPlayers([]);
      setDashboardStats({ totalSpent: 0, totalDates: 0, totalHookups: 0, averageCPN: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const formatPeriodLabel = useCallback((period: string) => {
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
    if (cpnData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 size={48} className="mb-4" />
          <p className="text-lg font-medium mb-2">No CPN data available</p>
          <p className="text-sm text-center">Add some meetings with performance ratings to see your CPN trends</p>
        </div>
      );
    }

    const maxCPN = Math.max(...cpnData.map(d => d.cpn));
    const minCPN = Math.min(...cpnData.map(d => d.cpn));
    const range = maxCPN - minCPN;
    const padding = range * 0.1;
    const chartHeight = 300;
    const chartWidth = 600;

    return (
      <div className="relative">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight - (ratio * (chartHeight - 40)) - 20;
            const value = minCPN - padding + (ratio * (range + 2 * padding));
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
                  const y = chartHeight - 20 - ((d.cpn - (minCPN - padding)) / (range + 2 * padding)) * (chartHeight - 40);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')} L ${60 + (chartWidth - 100)} ${chartHeight - 20} L 60 ${chartHeight - 20} Z`}
                fill="url(#cpnGradient)"
              />

              {/* Line */}
              <path
                d={cpnData.map((d, i) => {
                  const x = 60 + (i * (chartWidth - 100)) / (cpnData.length - 1);
                  const y = chartHeight - 20 - ((d.cpn - (minCPN - padding)) / (range + 2 * padding)) * (chartHeight - 40);
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
            const y = chartHeight - 20 - ((d.cpn - (minCPN - padding)) / (range + 2 * padding)) * (chartHeight - 40);
            
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-white">Loading playbook data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Playbook Analytics</h1>

        {/* Performance Overview */}
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8">
          {/* CPN Chart */}
          <div className="bg-black border-2 border-green-500 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Average Cost Per Night</h2>
              <div className="flex bg-gray-700 rounded-lg p-1 text-xs lg:text-sm">
                {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2 lg:px-4 py-2 rounded-md font-medium transition-colors ${
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

          {/* Top Players */}
          <div className="bg-black border-2 border-green-500 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Top Players by Rating</h2>
            <div className="space-y-4">
              {topPlayers.length > 0 ? (
                topPlayers.map((player, index) => (
                  <div key={player.id} className="bg-black border-2 border-green-500 rounded-lg p-4 hover:border-green-400 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-sm">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600">
                        <img 
                          src={player.image_url || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
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
        </div>
      </div>
    </div>
  );
});

export default PlaybookScreen;