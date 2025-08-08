import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, memo, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import AuthWrapper from './components/AuthWrapper';
import LeftSidebar from './components/LeftSidebar';
import MobileHeader from './components/MobileHeader';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import PasswordResetPage from './components/PasswordResetPage';
import AuthCallback from './components/AuthCallback';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { usePreloader, preloadData } from './hooks/useDataLoader';
import { fastPlayerService } from './services/fastPlayerService';
import { statsApi, datesApi } from './services/api';
import type { Tables } from './lib/supabase';

// Lazy load heavy components
const HubScreen = React.lazy(() => import('./components/FastHubScreen'));
const RosterScreen = React.lazy(() => import('./components/FastRosterScreen'));
const PlaybookScreen = React.lazy(() => import('./components/PlaybookScreen'));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen'));
const PlayerProfile = React.lazy(() => import('./components/PlayerProfile'));

type Player = Tables<'profiles'>;

const AppContent = memo(function AppContent() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [backgroundLoadingComplete, setBackgroundLoadingComplete] = useState(false);
  
  // Start background preloading for instant navigation
  const { preloadStatus, isPreloading } = usePreloader();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/hub') return 'hub';
    if (path === '/roster') return 'roster';
    if (path === '/playbook') return 'playbook';
    if (path === '/settings') return 'settings';
    return 'hub';
  };

  const activeTab = getCurrentTab();

  // Start background preloading immediately when app loads
  useEffect(() => {
    const startBackgroundPreloading = async () => {
      console.log('🚀 Starting background preloading for instant app experience...');
      const startTime = performance.now();
      
      try {
        // Preload all critical data in parallel
        await Promise.allSettled([
          // Roster data - highest priority
          preloadData('players_basic', () => fastPlayerService.getPlayersBasic(), 30),
          
          // Hub data - second priority
          preloadData('recent_basic_3', () => fastPlayerService.getRecentPlayersBasic(3), 30),
          preloadData('getUpcomingDates', () => datesApi.getUpcomingDates(), 20),
          
          // Playbook data - third priority
          preloadData('getDashboardStats', () => statsApi.getDashboardStats(), 30),
          preloadData('getCPNByPeriod_monthly', () => statsApi.getCPNByPeriod('monthly'), 30),
          preloadData('getTopPlayersByRating_3', () => statsApi.getTopPlayersByRating(3), 30),
        ]);
        
        const endTime = performance.now();
        console.log(`✅ Background preloading completed in ${Math.round(endTime - startTime)}ms`);
        setBackgroundLoadingComplete(true);
        
      } catch (error) {
        console.warn('⚠️ Some background preloading failed:', error);
        setBackgroundLoadingComplete(true); // Still mark as complete to avoid blocking UI
      }
    };
    
    // Start preloading after a brief delay to not block initial render
    const timer = setTimeout(startBackgroundPreloading, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setIsMobileMenuOpen(false);
  };

  const handleBackToRoster = () => {
    setSelectedPlayer(null);
    navigate('/roster');
  };

  const handleTabChange = (tab: string) => {
    setSelectedPlayer(null);
    setIsMobileMenuOpen(false);
    navigate(`/${tab === 'hub' ? '' : tab}`);
  };

  // Simple loading fallback
  const LoadingFallback = memo(({ route }: { route?: string }) => (
    <div className="p-4 lg:p-8">
      <div className="text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white">Loading...</p>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-black">
      <MobileHeader 
        isMenuOpen={isMobileMenuOpen}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <LeftSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="transition-all duration-300 pt-16 lg:pt-0 lg:ml-64">
        {/* Background preloading indicator */}
        {!backgroundLoadingComplete && (
          <div className="fixed top-4 right-4 bg-green-500 text-black px-3 py-2 rounded-lg text-sm font-medium z-50 animate-pulse">
            🚀 Optimizing app speed...
          </div>
        )}
        
        {selectedPlayer ? (
          <Suspense fallback={<LoadingFallback />}>
            <PlayerProfile 
              player={selectedPlayer} 
              onBack={handleBackToRoster}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingFallback route={activeTab} />}>
            <Routes>
              <Route path="/" element={<HubScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/hub" element={<HubScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/roster" element={<RosterScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/playbook" element={<PlaybookScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </Suspense>
        )}
      </div>
    </div>
  );
});

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Check if this is a password reset link
  const isPasswordReset = location.pathname === '/reset-password' || 
    location.search.includes('access_token') || 
    location.hash.includes('access_token') ||
    location.search.includes('type=recovery') ||
    location.hash.includes('type=recovery');

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Reset password should be accessible regardless of auth status */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      {!user && !isPasswordReset ? (
        <Route path="/*" element={<LandingPage />} />
      ) : (
        <Route path="/*" element={user ? <AppContent /> : <ResetPasswordPage />} />
      )}
    </Routes>
  );
}