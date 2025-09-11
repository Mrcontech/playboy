import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionData {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured - subscription features disabled');
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        // Handle specific Supabase connection errors gracefully
        if (fetchError.message.includes('Failed to fetch') || 
            fetchError.message.includes('NetworkError') ||
            fetchError.message.includes('fetch')) {
          console.warn('Unable to connect to Supabase - subscription features disabled');
          setSubscription(null);
          setError(null); // Don't show error to user for connection issues
          return;
        }
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      
      // Handle network/connection errors gracefully
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.warn('Network error fetching subscription - continuing without subscription data');
        setError(null); // Don't show error to user for network issues
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      }
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.subscription_status === 'active';
  const isPro = isActive && subscription?.price_id;
  
  const currentPlan = subscription?.price_id 
    ? getProductByPriceId(subscription.price_id)?.name || 'Unknown Plan'
    : 'Free';

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription' = 'subscription') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cancel`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.assign(url);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    isActive,
    isPro,
    currentPlan,
    createCheckoutSession,
    refetch: fetchSubscription,
  };
}