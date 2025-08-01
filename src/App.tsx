import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthWrapper from './components/AuthWrapper';
import LeftSidebar from './components/LeftSidebar';
import MobileHeader from './components/MobileHeader';
import HubScreen from './components/HubScreen';
import RosterScreen from './components/RosterScreen';
import PlaybookScreen from './components/PlaybookScreen';
import SettingsScreen from './components/SettingsScreen';
import PlayerProfile from './components/PlayerProfile';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import { useAuth } from './hooks/useAuth';
import type { Tables } from './lib/supabase';

type Player = Tables<'profiles'>;

function AppContent() {
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
            <PlayerProfile 
              player={selectedPlayer} 
              onBack={handleBackToRoster}
            />
          ) : (
            <Routes>
              <Route path="/" element={<HubScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/hub" element={<HubScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/roster" element={<RosterScreen onPlayerSelect={handlePlayerSelect} />} />
              <Route path="/playbook" element={<PlaybookScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  return (
    <Routes>
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/*" element={<AppContent />} />
    </Routes>
  );
}