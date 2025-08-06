import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');

  // Check if we have access token from email link
  React.useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      setStep('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset email sent! Check your inbox and click the link to reset your password.');
      }
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
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
        setMessage('Password updated successfully! You can now sign in with your new password.');
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
          <h1 className="text-4xl font-bold text-white mb-3">
            {step === 'request' ? 'Reset Password' : 'Set New Password'}
          </h1>
          <p className="text-gray-400 text-lg">
            {step === 'request' 
              ? 'Enter your email to receive a password reset link'
              : 'Enter your new password below'
            }
          </p>
        </div>

        <div className="bg-black border-2 border-green-500 rounded-2xl p-8 shadow-2xl">
          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-4 py-4 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter your email"
                    required
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
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-700 disabled:to-green-800 text-black py-4 rounded-xl font-bold transition-all text-lg shadow-lg transform hover:scale-105"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
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
                disabled={loading}
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