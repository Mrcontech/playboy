import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Suspense, memo } from 'react';
import LandingPage from './components/LandingPage';
import AuthWrapper from './components/AuthWrapper';
import LeftSidebar from './components/LeftSidebar';
import MobileHeader from './components/MobileHeader';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
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

  const activeTab = getCurrentTab();

  return (
    <AuthWrapper>
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
          {selectedPlayer ? (
            <Suspense fallback={<div className="p-8"><LoadingSpinner text="Loading player profile..." /></div>}>
              <PlayerProfile 
                player={selectedPlayer} 
                onBack={handleBackToRoster}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="p-8"><LoadingSpinner text="Loading..." /></div>}>
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
    </AuthWrapper>
  );
});

export default function App() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Reset password should be accessible regardless of auth status */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      {!user ? (
        <Route path="/*" element={<LandingPage />} />
      ) : (
        <Route path="/*" element={<AppContent />} />
      )}
    </Routes>
  );
}