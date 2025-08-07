import React from 'react';
import { Loader2, Heart, Users, BarChart3 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'simple' | 'detailed';
}

export default function LoadingSpinner({ size = 'medium', text, variant = 'simple' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  if (variant === 'detailed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        {/* Main logo with pulse animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
            <Heart className="text-white animate-bounce" size={40} />
          </div>
          {/* Rotating ring around logo */}
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-green-400 rounded-full animate-spin"></div>
          {/* Outer glow ring */}
          <div className="absolute -inset-2 w-24 h-24 border-2 border-green-500/30 rounded-full animate-ping"></div>
        </div>

        {/* App name with typing effect */}
        <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">Playboi</h2>
        
        {/* Loading text with dots animation */}
        <div className="flex items-center space-x-2 mb-8">
          <span className="text-gray-300 text-lg">{text || 'Loading your roster'}</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Feature icons with staggered animations */}
        <div className="flex items-center space-x-8">
          <div className="flex flex-col items-center animate-pulse" style={{ animationDelay: '0ms' }}>
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
              <Users className="text-purple-400" size={24} />
            </div>
            <span className="text-gray-400 text-xs">Players</span>
          </div>
          <div className="flex flex-col items-center animate-pulse" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
              <BarChart3 className="text-blue-400" size={24} />
            </div>
            <span className="text-gray-400 text-xs">Analytics</span>
          </div>
          <div className="flex flex-col items-center animate-pulse" style={{ animationDelay: '400ms' }}>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <Heart className="text-green-400" size={24} />
            </div>
            <span className="text-gray-400 text-xs">Dates</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 bg-gray-800 rounded-full h-2 mt-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        <p className="text-gray-500 text-sm mt-4">Setting up your dating dashboard...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} text-green-500 animate-spin mb-2`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  );
}