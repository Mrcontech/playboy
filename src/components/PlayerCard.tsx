import React, { memo } from 'react';
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

const PlayerCard = memo(function PlayerCard({ player, onClick, size = 'medium' }: PlayerCardProps) {
  const sizeClasses = {
    small: 'w-36',
    medium: 'w-40',
    large: 'w-48'
  };

  const avatarSizes = {
    small: 'h-28',
    medium: 'h-32', 
    large: 'h-40'
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-black border-2 border-green-500 rounded-xl overflow-hidden cursor-pointer hover:border-green-400 transition-all duration-200 hover:scale-105 shadow-lg flex-shrink-0`}
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
      <div className="p-2">
        {/* Name */}
        <h3 className="text-white font-semibold text-center mb-1 truncate text-xs">{player.name}</h3>
        
        {/* Status Badge */}
        {player.status && (
          <div className="flex justify-center mb-2">
            <span className="bg-green-500 text-black px-2 py-0.5 rounded-full text-xs font-medium">
              {player.status === 'side_piece' ? '🍑' : 
               player.status === 'wifey' ? '💍' : 
               player.status === 'dating' ? '❤️' : 
               player.status === 'situationship' ? '🤷‍♀️' : '👀'}
            </span>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-center space-x-1 text-xs">
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
              <span className="text-green-500 font-bold text-xs">${player.cpn > 999 ? Math.round(player.cpn/1000) + 'k' : player.cpn}</span>
            </div>
          )}
          
          {/* Average Rating */}
          {player.averageRating !== undefined && (
            <div className="flex items-center space-x-1">
              <span>⭐</span>
              <span className="text-white font-bold text-xs">{player.averageRating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;