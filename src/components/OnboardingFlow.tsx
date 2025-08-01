import React, { useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import AddPlayerModal from './AddPlayerModal';
import { useAuth } from '../hooks/useAuth';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [playerAdded, setPlayerAdded] = useState(false);
  const { user } = useAuth();

  const handlePlayerAdded = () => {
    setPlayerAdded(true);
    setShowAddPlayerModal(false);
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-black border-2 border-green-500 rounded-xl p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <Heart className="text-black" size={40} />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Playboi!
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            Let's get you started by adding your first player to your roster.
          </p>

          {!playerAdded ? (
            <div className="space-y-6">
              <div className="bg-black border border-green-500 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Step 1: Add Your First Player</h3>
                <p className="text-gray-400 mb-4">
                  Start building your dating roster by adding someone you're interested in or currently dating.
                </p>
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Add First Player
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-black border border-green-500 rounded-lg p-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-black text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">Great! Your first player has been added</h3>
                <p className="text-gray-400 mb-6">
                  Now let's unlock the full power of Playboi Pro to manage your entire dating roster.
                </p>
                <button
                  onClick={handleContinue}
                  className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <span>Continue to Playboi Pro</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={handlePlayerAdded}
      />
    </div>
  );
}