import React, { useState } from 'react';
import { LogOut, User, Shield, Trash2, Eye, EyeOff, Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { isPro, currentPlan } = useSubscription();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        alert(`Failed to change password: ${error.message}`);
      } else {
        alert('Password changed successfully!');
      }
      
      setNewPassword('');
      setConfirmPassword('');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      // Account deletion successful - user will be automatically signed out
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* User Info Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <div className="text-white font-medium">{user?.email}</div>
              <div className="text-gray-400 text-sm">Member since {new Date(user?.created_at || '').toLocaleDateString()}</div>
              <div className="flex items-center space-x-2 mt-1">
                {isPro && <Crown className="text-yellow-400" size={16} />}
                <span className={`text-sm font-medium ${isPro ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {currentPlan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="space-y-4">
          {/* Edit Profile */}
          <div className="bg-gray-800 rounded-xl p-6">
            <button
              onClick={() => setShowEditProfile(true)}
              className="w-full flex items-center justify-between hover:bg-gray-700 p-4 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Shield className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">Edit Profile</div>
                  <div className="text-gray-400 text-sm">Change password and manage account</div>
                </div>
              </div>
              <div className="text-gray-400">→</div>
            </button>
          </div>

          {/* Sign Out */}
          <div className="bg-gray-800 rounded-xl p-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between hover:bg-gray-700 p-4 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-red-600 p-3 rounded-lg">
                  <LogOut className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <div className="text-white font-medium">Sign Out</div>
                  <div className="text-gray-400 text-sm">Sign out of your account</div>
                </div>
              </div>
              <div className="text-gray-400">→</div>
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Profile</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-gray-700 text-gray-400 px-4 py-3 rounded-lg border border-gray-600 cursor-not-allowed"
                  />
                  <p className="text-gray-400 text-xs mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 pr-12 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="Enter new password"
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
                  <label className="block text-white font-medium mb-2">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfile(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="flex-1 bg-green-400 text-black py-3 rounded-lg hover:bg-green-500 disabled:bg-green-600 transition-colors"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              {/* Delete Account Section */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-red-400 font-medium mb-3">Danger Zone</h4>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-4">Delete Account</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data including players, meetings, and statistics.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-red-800 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}