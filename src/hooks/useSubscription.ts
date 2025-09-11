import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getProductByPriceId } from '../stripe-config';
import { persistentCache } from '../lib/storage';

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
    const cacheKey = `subscription_${user?.id}`;
    
    // Check cache first for instant loading
    const cached = persistentCache.get<SubscriptionData>(cacheKey);
    if (cached) {
      console.log('⚡ Using cached subscription data');
      setSubscription(cached);
      setLoading(false);
      
      // Still fetch fresh data in background
      fetchFreshSubscription(cacheKey);
      return;
    }
    
    // No cache, fetch fresh data
    await fetchFreshSubscription(cacheKey);
  };

  const fetchFreshSubscription = async (cacheKey: string) => {
    try {
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription check timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();
      
      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;


      if (fetchError) {
        console.warn('Subscription fetch failed:', fetchError);
        // Don't throw error, just set to null and continue
        setSubscription(null);
        setError(null); // Don't show error to user for subscription issues
      } else {
        setSubscription(data);
        // Cache the result for 5 minutes
        if (data) {
          persistentCache.set(cacheKey, data, 5);
        }
      }

    } catch (err) {
      console.warn('Subscription check failed:', err);
      // Don't show error to user, just continue without subscription
      setSubscription(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // More lenient subscription checking
  const isActive = subscription?.subscription_status === 'active' || 
                   subscription?.subscription_status === 'trialing';
  const isPro = isActive && subscription?.price_id;
  
  const currentPlan = subscription?.price_id 
    ? getProductByPriceId(subscription.price_id)?.name || 'Unknown Plan'
    : 'Free';

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription' = 'subscription') => {
    try {
      // Add timeout for checkout session creation too
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Checkout timeout')), 15000); // 15 second timeout
      });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const fetchPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
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
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

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