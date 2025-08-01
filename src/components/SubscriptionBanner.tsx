import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { STRIPE_PRODUCTS } from '../stripe-config';

export default function SubscriptionBanner() {
  const { isPro, currentPlan, createCheckoutSession } = useSubscription();

  if (isPro) {
    return (
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-3 rounded-lg mb-6">
        <div className="flex items-center justify-center space-x-2">
          <Crown size={20} />
          <span className="font-medium">{currentPlan} Active</span>
          <Sparkles size={16} />
        </div>
      </div>
    );
  }

  const handleUpgrade = async () => {
    try {
      const proProduct = STRIPE_PRODUCTS.find(p => p.name === 'Playboi Pro');
      if (proProduct) {
        await createCheckoutSession(proProduct.priceId, proProduct.mode);
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crown size={20} />
          <span className="font-medium">Upgrade to Playboi Pro</span>
        </div>
        <button
          onClick={handleUpgrade}
          className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-medium transition-colors"
        >
          $0.99/month
        </button>
      </div>
    </div>
  );
}