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
import { preloadData, usePreloader } from './hooks/useDataLoader';
import { playerApi, statsApi, datesApi } from './services/api';
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
  const [preloadingComplete, setPreloadingComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the preloader hook for better performance
  const { preloadForRoute, isPreloading } = usePreloader();
  
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

  // Preload critical data on app start
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Step 1: Load critical data for current route immediately
        await preloadForRoute(activeTab);
        
        if (!isMounted) return;
        
        console.log('✅ Critical data loaded for', activeTab);
        
        // Step 2: Start background preloading for other routes
        setTimeout(async () => {
          if (!isMounted) return;
          
          console.log('🔄 Starting background preloading...');
          
          // Preload other routes in order of likely usage
          const routesToPreload = ['roster', 'playbook', 'settings'].filter(route => route !== activeTab);
          
          for (const route of routesToPreload) {
            if (!isMounted) break;
            await preloadForRoute(route);
            console.log(`✅ Background preloaded: ${route}`);
            // Small delay between preloads to not overwhelm the browser
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          if (isMounted) {
            setPreloadingComplete(true);
            console.log('🎉 All background preloading complete');
          }
        }, 100); // Reduced delay for faster background loading
        
      } catch (error) {
        console.error('❌ Error during app initialization:', error);
        if (isMounted) {
          setPreloadingComplete(true); // Don't block UI on error
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, preloadForRoute]);

  // Preload data when user hovers over navigation items
  const handleNavHover = useCallback((route: string) => {
    if (route !== activeTab && !isPreloading) {
      preloadForRoute(route);
    }
  }, [activeTab, isPreloading, preloadForRoute]);

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

  // Enhanced loading fallback with route-specific content
  const LoadingFallback = memo(({ route }: { route?: string }) => (
    <div className="p-4 lg:p-8">
      <LoadingSpinner 
        variant="detailed" 
        text={
          route === 'playbook' ? 'Loading analytics dashboard...' :
          route === 'roster' ? 'Loading player roster...' :
          route === 'settings' ? 'Loading settings...' :
          'Loading dashboard...'
        } 
      />
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
        onNavHover={handleNavHover}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="transition-all duration-300 pt-16 lg:pt-0 lg:ml-64">
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
        <LoadingSpinner text="Loading..." />
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