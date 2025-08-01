import React, { useState } from 'react';
import { Crown, Check, Loader2, Heart, Star, BarChart3, Calendar } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { STRIPE_PRODUCTS } from '../stripe-config';

export default function SubscriptionRequired() {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession } = useSubscription();
  const { signOut } = useAuth();

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const proFeatures = [
    {
      icon: Star,
      title: 'Unlimited Player Profiles',
      description: 'Add and manage as many dating prospects as you want'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track your dating performance with detailed insights'
    },
    {
      icon: Calendar,
      title: 'Date Scheduling',
      description: 'Plan and organize your upcoming dates seamlessly'
    },
    {
      icon: Heart,
      title: 'AI-Powered Recaps',
      description: 'Get intelligent summaries of your dating history'
    }
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6">
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6">
            <Heart className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Playboi Pro
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Unlock the full power of professional dating roster management. 
            Upgrade to Playboi Pro to access all premium features.
          </p>
        </div>

        <div className="bg-black border-2 border-green-500 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
              <Crown className="text-white" size={32} />
            </div>
            <div className="text-5xl font-bold text-white mb-2">$0.99</div>
            <div className="text-gray-400 text-lg">per month</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-900 rounded-lg">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg flex-shrink-0">
                  <feature.icon className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-black py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Crown size={24} />
                  <span>Upgrade to Playboi Pro</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Secure payment processing powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}