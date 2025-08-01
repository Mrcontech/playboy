import React, { useState } from 'react';
import { X, Crown, Check, Loader2 } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { STRIPE_PRODUCTS } from '../stripe-config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession } = useSubscription();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const proProduct = STRIPE_PRODUCTS.find(p => p.name === 'Playboi Pro');
      if (proProduct) {
        await createCheckoutSession(proProduct.priceId, proProduct.mode);
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      setLoading(false);
    }
  };

  const proFeatures = [
    'Unlimited player profiles',
    'Advanced analytics & insights',
    'AI-powered date recaps',
    'Performance tracking',
    'Cost per night analysis',
    'Priority customer support',
    'Export data functionality',
    'Advanced filtering & search'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upgrade to Playboi Pro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="text-white" size={32} />
          </div>
          <div className="text-4xl font-bold text-white mb-2">$0.99</div>
          <div className="text-gray-400">per month</div>
        </div>

        <div className="space-y-3 mb-8">
          {proFeatures.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Check className="text-green-400 flex-shrink-0" size={20} />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Crown size={20} />
                <span>Upgrade Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}