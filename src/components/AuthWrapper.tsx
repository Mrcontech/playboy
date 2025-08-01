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

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (isNewUser) {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }
  if (!isPro) {
    return <SubscriptionRequired />;
  }

  return <>{children}</>;
}