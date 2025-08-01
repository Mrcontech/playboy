import React from 'react';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import type { Tables } from '../lib/supabase';

type UpcomingDate = Tables<'upcoming_dates'>;

interface UpcomingDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: UpcomingDate | null;
  playerName?: string;
}

export default function UpcomingDateModal({ isOpen, onClose, date, playerName }: UpcomingDateModalProps) {
  if (!isOpen || !date) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const { date: formattedDate, time } = formatDate(date.date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Date</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Player Info */}
          {playerName && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {playerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">{playerName}</div>
                  <div className="text-gray-400 text-sm">Date with</div>
                </div>
              </div>
            </div>
          )}

          {/* Date Type */}
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-3 rounded-lg">
              <Calendar className="text-white" size={20} />
            </div>
            <div>
              <div className="text-white font-medium">Date Type</div>
              <div className="text-gray-400 capitalize">{date.type}</div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Clock className="text-white" size={20} />
            </div>
            <div>
              <div className="text-white font-medium">When</div>
              <div className="text-gray-400">{formattedDate}</div>
              <div className="text-gray-400">{time}</div>
            </div>
          </div>

          {/* Notes */}
          {date.notes && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Notes</h4>
              <p className="text-gray-300 leading-relaxed">{date.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // TODO: Implement edit functionality
                alert('Edit functionality coming soon!');
              }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}