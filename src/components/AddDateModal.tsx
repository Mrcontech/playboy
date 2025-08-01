import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { datesApi, playerApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;

interface AddDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDateAdded: () => void;
}

export default function AddDateModal({ isOpen, onClose, onDateAdded }: AddDateModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [formData, setFormData] = useState({
    profile_id: '',
    type: 'dinner',
    date: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen]);

  const loadPlayers = async () => {
    try {
      const data = await playerApi.getAllPlayers();
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await datesApi.createDate({
        profile_id: formData.profile_id || null,
        type: formData.type,
        date: formData.date,
        notes: formData.notes || null,
      });
      
      onDateAdded();
      onClose();
      setFormData({
        profile_id: '',
        type: 'dinner',
        date: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating date:', error);
    } finally {
      setLoading(false);
    }
  };

  const dateTypes = [
    'dinner',
    'drinks',
    'coffee',
    'lunch',
    'activity',
    'movie',
    'event',
    'casual',
    'other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Schedule New Date</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Select Player</label>
            <select
              value={formData.profile_id}
              onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Choose a player...</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Date Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {dateTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Location, special plans, reminders..."
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
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-800 transition-colors"
            >
              {loading ? 'Scheduling...' : 'Schedule Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}