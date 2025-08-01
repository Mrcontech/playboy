import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight, Crown } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export default function SuccessPage() {
  const { refetch, currentPlan } = useSubscription();

  useEffect(() => {
    // Refetch subscription data after successful payment
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  const handleContinue = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-300 mb-6">
            Welcome to {currentPlan}! Your subscription is now active and you have full access to all premium features.
          </p>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-white">
              <Crown size={20} />
              <span className="font-semibold">{currentPlan} Activated</span>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-green-400 hover:bg-green-500 text-black py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}