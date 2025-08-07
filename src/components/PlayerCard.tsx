import React, { memo } from 'react';
import { Star, DollarSign, Heart, User } from 'lucide-react';

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
  isLoading?: boolean;
}

const PlayerCard = memo(function PlayerCard({ player, onClick, size = 'medium', isLoading = false }: PlayerCardProps) {
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
      className={`${sizeClasses[size]} bg-black border-2 border-green-500 rounded-xl overflow-hidden transition-all duration-200 shadow-lg flex-shrink-0 ${
        isLoading 
          ? 'cursor-wait opacity-75' 
          : 'cursor-pointer hover:border-green-400 hover:scale-105'
      }`}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className={`${avatarSizes[size]} w-full overflow-hidden bg-black`}>
        {player.avatar ? (
          <img 
            src={player.avatar} 
            alt={player.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to default avatar on image load error
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center">
                  <svg class="text-white" width="${size === 'small' ? 20 : size === 'medium' ? 24 : 32}" height="${size === 'small' ? 20 : size === 'medium' ? 24 : 32}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="text-white" size={size === 'small' ? 20 : size === 'medium' ? 24 : 32} />
          </div>
        )}
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