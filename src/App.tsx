import React, { useState } from 'react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('hub');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  // Check for success/cancel pages based on URL
  const currentPath = window.location.pathname;
  
  if (currentPath === '/success') {
    return <SuccessPage />;
  }
  
  if (currentPath === '/cancel') {
    return <CancelPage />;
  }

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
  };

  const handleBackToRoster = () => {
    setSelectedPlayer(null);
    setActiveTab('roster');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes
  };

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

  // Wrap authenticated content with subscription check
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
            <>
              {activeTab === 'hub' && <HubScreen onPlayerSelect={handlePlayerSelect} />}
              {activeTab === 'roster' && <RosterScreen onPlayerSelect={handlePlayerSelect} />}
              {activeTab === 'playbook' && <PlaybookScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
}