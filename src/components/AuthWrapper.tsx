import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import LoginScreen from './LoginScreen';
import SubscriptionRequired from './SubscriptionRequired';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading: authLoading } = useAuth();
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

  if (!isPro) {
    return <SubscriptionRequired />;
  }

  return <>{children}</>;
}