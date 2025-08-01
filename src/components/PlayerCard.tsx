import React from 'react';
import { Star, DollarSign, Heart } from 'lucide-react';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    avatar: string;
    status?: string;
    totalMeetings?: number;
    cpn?: number;
    averageRating?: number;
    isActive?: boolean;
  };
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function PlayerCard({ player, onClick, size = 'medium' }: PlayerCardProps) {
  const sizeClasses = {
    small: 'w-36',
    medium: 'w-44',
    large: 'w-52'
  };

  const avatarSizes = {
    small: 'h-28',
    medium: 'h-36', 
    large: 'h-44'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-750 transition-all duration-200 hover:scale-105 shadow-lg`}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className={`${avatarSizes[size]} w-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600`}>
        <img 
          src={player.avatar} 
          alt={player.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-white font-semibold text-center mb-3 truncate text-sm">{player.name}</h3>
        
        {/* Status Badge */}
        {player.status && (
          <div className="flex justify-center mb-4">
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              {player.status === 'side_piece' ? '🍑' : 
               player.status === 'wifey' ? '💍' : 
               player.status === 'dating' ? '❤️' : 
               player.status === 'situationship' ? '🤷‍♀️' : '👀'}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-center space-x-3 text-xs">
          {/* Dates Count */}
          {player.totalMeetings !== undefined && (
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span className="text-white font-bold">{player.totalMeetings}</span>
            </div>
          )}
          
          {/* CPN (Cost Per Night) */}
          {player.cpn !== undefined && (
            <div className="flex items-center space-x-1">
              <span>💰</span>
              <span className="text-green-400 font-bold">${player.cpn}</span>
            </div>
          )}
          
          {/* Average Rating */}
          {player.averageRating !== undefined && (
            <div className="flex items-center space-x-1">
              <span>⭐</span>
              <span className="text-white font-bold">{player.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}