import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session after Supabase processes the verification
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/reset-password?error=' + encodeURIComponent(error.message));
          return;
        }

        if (session) {
          // Session is valid, redirect to password reset form
          navigate('/password-reset?verified=true');
        } else {
          // No session, something went wrong
          navigate('/reset-password?error=' + encodeURIComponent('Invalid or expired reset link'));
        }
      } catch (err) {
        console.error('Exception in auth callback:', err);
        navigate('/reset-password?error=' + encodeURIComponent('Failed to process reset link'));
      }
    };

    // Small delay to allow Supabase to process the verification
    const timer = setTimeout(handleAuthCallback, 500);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="large" text="Processing password reset link..." />
        <p className="text-gray-400 mt-4">Please wait while we verify your reset link</p>
      </div>
    </div>
  );
}