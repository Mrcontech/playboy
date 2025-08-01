import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function CancelPage() {
  const handleGoBack = () => {
    window.location.href = '/';
  };

  const handleTryAgain = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 rounded-xl p-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-white" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-300 mb-8">
            Your payment was cancelled. No charges were made to your account. You can try again anytime.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleTryAgain}
              className="w-full bg-green-400 hover:bg-green-500 text-black py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={handleGoBack}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}