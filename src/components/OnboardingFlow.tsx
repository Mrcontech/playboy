import React, { useState } from 'react';
import { Heart, ArrowRight, Users, Calendar, Plus } from 'lucide-react';
import AddPlayerModal from './AddPlayerModal';
import AddDateModal from './AddDateModal';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'next-steps'>('welcome');
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [playerAdded, setPlayerAdded] = useState(false);

  const handlePlayerAdded = () => {
    setPlayerAdded(true);
    setShowAddPlayerModal(false);
    setCurrentStep('next-steps');
  };

  const handleDateAdded = () => {
    setShowAddDateModal(false);
  };

  const handleFinish = () => {
    onComplete();
  };

  if (currentStep === 'welcome') {
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
        </div>

        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onPlayerAdded={handlePlayerAdded}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <div className="bg-black border-2 border-green-500 rounded-xl p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
            <Heart className="text-black" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Great! Your first player has been added
          </h1>
          
          <p className="text-xl text-gray-300 mb-8">
            What would you like to do next? You can add more players, schedule dates, or jump straight into the app.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Add More Players */}
            <div className="bg-gray-900 border border-green-500 rounded-lg p-6 hover:border-green-400 transition-colors">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Add More Players</h3>
              <p className="text-gray-400 mb-4 text-sm">
                Build out your roster with additional dating prospects
              </p>
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus size={16} />
                <span>Add Player</span>
              </button>
            </div>

            {/* Schedule Dates */}
            <div className="bg-gray-900 border border-green-500 rounded-lg p-6 hover:border-green-400 transition-colors">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-white" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Schedule Dates</h3>
              <p className="text-gray-400 mb-4 text-sm">
                Plan your upcoming dates and stay organized
              </p>
              <button
                onClick={() => setShowAddDateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus size={16} />
                <span>Add Date</span>
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleFinish}
              className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <span>Continue to Playboi Pro</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <AddPlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onPlayerAdded={() => {
          setShowAddPlayerModal(false);
        }}
      />

      <AddDateModal
        isOpen={showAddDateModal}
        onClose={() => setShowAddDateModal(false)}
        onDateAdded={handleDateAdded}
      />
    </div>
  );
}