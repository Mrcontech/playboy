import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(() => {
    // Check localStorage for new user flag
    return localStorage.getItem('playboi_new_user') === 'true';
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        // Clear stale authentication data if refresh token is invalid
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Clear new user flag on sign in
    localStorage.removeItem('playboi_new_user');
    setIsNewUser(false);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    // Mark as new user if signup was successful
    if (!error && data.user) {
      localStorage.setItem('playboi_new_user', 'true');
      setIsNewUser(true);
    }
    
    return { data, error };
  };

  const signOut = async () => {
    // Clear new user flag on sign out
    localStorage.removeItem('playboi_new_user');
    setIsNewUser(false);
    
    const { error } = await supabase.auth.signOut();
    
    // If session doesn't exist, treat as successful logout
    if (error?.message === 'Session from session_id claim in JWT does not exist') {
      return { error: null };
    }
    
    return { error };
  };

  const completeOnboarding = () => {
    localStorage.removeItem('playboi_new_user');
    setIsNewUser(false);
  };
  return {
    user,
    session,
    loading,
    isNewUser,
    signIn,
    signUp,
    signOut,
    completeOnboarding,
  };
}