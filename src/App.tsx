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
import { useBackgroundPreloader } from './hooks/useBackgroundPreloader';
import type { Tables } from './lib/supabase';

// Lazy load heavy components
const HubScreen = React.lazy(() => import('./components/HubScreen'));
const RosterScreen = React.lazy(() => import('./components/RosterScreen'));
const PlaybookScreen = React.lazy(() => import('./components/PlaybookScreen'));
const SettingsScreen = React.lazy(() => import('./components/SettingsScreen'));
const PlayerProfile = React.lazy(() => import('./components/PlayerProfile'));

type Player = Tables<'profiles'>;

const AppContent = memo(function AppContent() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Start background preloading for instant navigation
  const { preloadStatus, isPreloading } = useBackgroundPreloader();
  
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
        {isPreloading && (
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