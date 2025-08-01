import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ 
  rating, 
  maxRating = 10, 
  size = 'medium',
  readonly = true,
  onChange 
}: StarRatingProps) {
  const sizeClasses = {
    small: 'w-2.5 h-2.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const handleClick = (newRating: number) => {
    if (!readonly && onChange) {
      onChange(newRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= Math.floor(rating);
        const isHalfFilled = starValue === Math.ceil(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={index}
            onClick={() => handleClick(starValue)}
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star 
              className={`${sizeClasses[size]} ${
                isFilled || isHalfFilled 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-600'
              }`}
            />
          </button>
        );
      })}
      <span className={`text-white font-medium ml-1 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>{rating.toFixed(1)}</span>
    </div>
  );
}