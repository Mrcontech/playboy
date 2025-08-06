import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const checkTokensAndSession = async () => {
      // Check if this is a verified session (from auth callback)
      const verified = searchParams.get('verified');
      if (verified === 'true') {
        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session && !sessionError) {
          console.log('Valid session found from auth callback');
          setIsValidToken(true);
          return;
        }
      }

      // Check for tokens in both URL search params and hash fragments
      const accessToken = searchParams.get('access_token') || getHashParam('access_token');
      const refreshToken = searchParams.get('refresh_token') || getHashParam('refresh_token');
      const type = searchParams.get('type') || getHashParam('type');
      
      // Also check for error parameters
      const error = searchParams.get('error') || getHashParam('error');
      const errorDescription = searchParams.get('error_description') || getHashParam('error_description');
      
      if (error) {
        console.error('Auth error:', error, errorDescription);
        setError(`Authentication error: ${errorDescription || error}`);
        return;
      }
      
      console.log('Tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
      
      if (accessToken && refreshToken && type === 'recovery') {
        console.log('Setting session with tokens...');
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        }).then(({ error }) => {
          if (error) {
            console.error('Error setting session:', error);
            setError(`Invalid or expired reset link: ${error.message}`);
          } else {
            console.log('Session set successfully');
            setIsValidToken(true);
          }
        }).catch(err => {
          console.error('Exception setting session:', err);
          setError('Failed to validate reset link');
        });
      } else if (type === 'recovery' && (!accessToken || !refreshToken)) {
        console.log('Recovery type found but missing tokens');
        setError('Reset link is missing authentication tokens. Please request a new password reset.');
      } else {
        console.log('No valid recovery tokens found');
        // Don't show error immediately - user might be navigating directly to this page
        // Only show error after a brief delay to allow for redirects
        setTimeout(() => {
          setError('Invalid reset link. The email link may be expired or malformed. Please request a new password reset.');
        }, 1000);
      }
    };

    checkTokensAndSession();

    // Listen for both hash and search parameter changes
    const handleUrlChange = () => {
      checkTokensAndSession();
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [searchParams]);

  // Helper function to get parameters from URL hash
  const getHashParam = (param: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get(param);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Sign In</span>
          </button>
          
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6">
            <img 
              src="/Playboi Social 1000x1000.png" 
              alt="Playboi Logo" 
              className="w-12 h-12 object-cover rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Set New Password</h1>
          <p className="text-gray-400 text-lg">Enter your new password below</p>
        </div>

        <div className="bg-black border-2 border-green-500 rounded-2xl p-8 shadow-2xl">
          {!isValidToken ? (
            <div className="text-center">
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-red-400 font-semibold mb-2">Invalid Reset Link</h3>
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={() => navigate('/reset-password')}
                  className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Request New Reset Link
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-14 py-4 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-4 py-4 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors text-lg"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {message && (
                <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isValidToken}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-700 disabled:to-green-800 text-black py-4 rounded-xl font-bold transition-all text-lg shadow-lg transform hover:scale-105"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}