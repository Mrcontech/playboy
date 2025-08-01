import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { playerApi } from '../services/api';
import type { Tables } from '../lib/supabase';

type Player = Tables<'profiles'>;

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated: () => void;
  onPlayerDeleted?: () => void;
  player: Player;
}

export default function EditPlayerModal({ isOpen, onClose, onPlayerUpdated, onPlayerDeleted, player }: EditPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    status: 'prospect',
    looks_rating: 5,
    likes: '',
    dislikes: '',
    notes: '',
    bench: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (player && isOpen) {
      setFormData({
        name: player.name || '',
        image_url: player.image_url || '',
        status: player.status || 'prospect',
        looks_rating: player.looks_rating || 5,
        likes: player.likes ? player.likes.join(', ') : '',
        dislikes: player.dislikes ? player.dislikes.join(', ') : '',
        notes: player.notes || '',
        bench: player.bench || false,
      });
    }
  }, [player, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData({ ...formData, image_url: result });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await playerApi.updatePlayer(player.id, {
        name: formData.name,
        image_url: formData.image_url || null,
        status: formData.status as any,
        looks_rating: formData.looks_rating,
        likes: formData.likes ? formData.likes.split(',').map(s => s.trim()) : [],
        dislikes: formData.dislikes ? formData.dislikes.split(',').map(s => s.trim()) : [],
        notes: formData.notes || null,
        bench: formData.bench,
      });
      
      onPlayerUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating player:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await playerApi.deletePlayer(player.id);
      onPlayerDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting player:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Player</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="prospect">Prospect</option>
                <option value="dating">Dating</option>
                <option value="situationship">Situationship</option>
                <option value="side_piece">Side Piece</option>
                <option value="wifey">Wifey</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Profile Image URL</label>
            {formData.image_url && (
              <div className="mb-4">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              </div>
            )}
            <div className="flex space-x-2">
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="https://example.com/image.jpg"
              />
              <label className="bg-gray-800 px-4 py-3 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer">
                <Upload className={`${uploading ? 'animate-spin' : ''} text-gray-400`} size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-gray-400 text-xs mt-2">Upload an image file or paste a URL above</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Looks Rating (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.looks_rating}
              onChange={(e) => setFormData({ ...formData, looks_rating: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>1</span>
              <span className="text-white font-medium">{formData.looks_rating}</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Likes (comma separated)</label>
            <input
              type="text"
              value={formData.likes}
              onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="working out, movies, travel"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Dislikes (comma separated)</label>
            <input
              type="text"
              value={formData.dislikes}
              onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="smoking, loud music, pets"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Additional notes about this person..."
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="bench"
              checked={formData.bench}
              onChange={(e) => setFormData({ ...formData, bench: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="bench" className="text-white font-medium">
              {formData.bench ? 'Move to Active' : 'Move to Bench'}
            </label>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Delete Player</span>
            </button>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-800 transition-colors"
              >
                {loading ? 'Updating...' : 'Update Player'}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Delete Player</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {player.name}? This action cannot be undone and will also delete all associated meetings and dates.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-red-800 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}