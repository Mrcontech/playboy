import React, { useState } from 'react';
import { X } from 'lucide-react';
import { meetingsApi } from '../services/api';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  playerId: string;
  playerName: string;
}

export default function AddExpenseModal({ 
  isOpen, 
  onClose, 
  onExpenseAdded, 
  playerId, 
  playerName 
}: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount_spent: '',
    base: '',
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
        rating: null,
        performance_rating: null,
        notes: formData.notes || null,
        date: formData.date,
      });
      
      onExpenseAdded();
      onClose();
      setFormData({
        type: 'expense',
        amount_spent: '',
        base: '',
        notes: '',
        date: new Date().toISOString().slice(0, 16),
      });
    } catch (error) {
      console.error('Error creating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const expenseTypes = [
    'expense',
    'gift',
    'dinner',
    'drinks',
    'shopping',
    'travel',
    'entertainment',
    'other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add Expense for {playerName}</h2>
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
              <label className="block text-white font-medium mb-2">Expense Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                {expenseTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Amount Spent ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_spent}
                onChange={(e) => setFormData({ ...formData, amount_spent: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                required
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
            <label className="block text-white font-medium mb-2">Location/Store</label>
            <input
              type="text"
              value={formData.base}
              onChange={(e) => setFormData({ ...formData, base: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="Store name, location, etc."
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="What was this expense for? Gift details, etc..."
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
              className="flex-1 bg-green-400 text-black py-3 rounded-lg hover:bg-green-500 disabled:bg-green-600 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}