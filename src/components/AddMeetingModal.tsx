import React, { useState } from 'react';
import { X } from 'lucide-react';
import { meetingsApi } from '../services/api';

interface AddMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingAdded: () => void;
  playerId: string;
  playerName: string;
}

export default function AddMeetingModal({ 
  isOpen, 
  onClose, 
  onMeetingAdded, 
  playerId, 
  playerName 
}: AddMeetingModalProps) {
  const [formData, setFormData] = useState({
    type: 'date',
    amount_spent: '',
    base: '',
    rating: 5,
    performance_rating: 5,
    include_performance: false,
    notes: '',
    date: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await meetingsApi.createMeeting({
        profile_id: playerId,
        type: formData.type,
        amount_spent: formData.amount_spent ? parseFloat(formData.amount_spent) : 0,
        base: formData.base || null,
        rating: formData.rating,
        performance_rating: formData.include_performance ? formData.performance_rating : null,
        notes: formData.notes || null,
        date: formData.date,
      });
      
      onMeetingAdded();
      onClose();
      setFormData({
        type: 'date',
        amount_spent: '',
        base: '',
        rating: 5,
        performance_rating: 5,
        include_performance: false,
        notes: '',
        date: new Date().toISOString().slice(0, 16),
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const meetingTypes = [
    'date',
    'hookup',
    'hangout',
    'dinner',
    'drinks',
    'coffee',
    'activity',
    'event',
    'other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Meeting with {playerName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Meeting Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                {meetingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Amount Spent ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_spent}
                onChange={(e) => setFormData({ ...formData, amount_spent: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Location/Base</label>
            <input
              type="text"
              value={formData.base}
              onChange={(e) => setFormData({ ...formData, base: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Restaurant name, location, etc."
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Meeting Experience (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>1</span>
              <span className="text-white font-medium">{formData.rating}</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="include_performance"
                checked={formData.include_performance}
                onChange={(e) => setFormData({ ...formData, include_performance: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="include_performance" className="text-white font-medium">
                Include Performance Rating 😏
              </label>
            </div>
            
            {formData.include_performance && (
              <>
                <label className="block text-white font-medium mb-2">Performance Rating 😏 (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.performance_rating}
                  onChange={(e) => setFormData({ ...formData, performance_rating: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>1</span>
                  <span className="text-white font-medium">{formData.performance_rating}</span>
                  <span>10</span>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="How did it go? Any memorable moments..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-green-800 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}