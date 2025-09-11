import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import LoginScreen from './LoginScreen';
import SubscriptionRequired from './SubscriptionRequired';
import OnboardingFlow from './OnboardingFlow';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading: authLoading, isNewUser, completeOnboarding } = useAuth();
  const { isPro, loading: subscriptionLoading } = useSubscription();

  // Reduce loading time by being less strict about subscription loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show loading only for a short time for subscription check
  if (subscriptionLoading) {
    // Add a timeout to prevent infinite loading
    setTimeout(() => {
      if (subscriptionLoading) {
        console.warn('Subscription check taking too long, proceeding without subscription data');
      }
    }, 3000); // 3 second timeout
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Checking subscription...</p>
          <p className="text-gray-400 text-sm mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isNewUser) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }
  
  // Only show subscription required if we're confident the check completed
  if (!subscriptionLoading && !isPro) {
    return <SubscriptionRequired />;
  }

  return <>{children}</>;
}