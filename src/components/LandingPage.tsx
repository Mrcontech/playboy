import React, { useState } from 'react';
import { Heart, Users, BarChart3, Calendar, Star, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Player Roster Management',
      description: 'Organize your dating prospects with detailed profiles, status tracking, and performance metrics.'
    },
    {
      icon: Calendar,
      title: 'Date Scheduling',
      description: 'Plan and track upcoming dates with integrated calendar and reminder system.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Get detailed analytics on your dating performance, spending patterns, and success rates.'
    },
    {
      icon: Star,
      title: 'AI-Powered Recaps',
      description: 'Generate intelligent summaries of your dating history with personalized insights.'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-8">
              <Heart className="text-white" size={40} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Playboi
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The ultimate dating roster management app. Track your game, analyze your performance, and level up your dating life with Playboi Pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-green-500 hover:bg-green-600 text-black px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Sign Up - $0.99/month</span>
                <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:bg-gray-800"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Master Your Dating Game
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional-grade tools to organize, analyze, and optimize your dating life like never before.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-black border-2 border-green-500 rounded-xl p-6 hover:border-green-400 transition-colors">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Benefits Section */}
      <section className="py-24 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Start Your Journey Today
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands of users who've leveled up their dating game
            </p>
          </div>
          
          <div className="bg-black border-2 border-green-500 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Playboi Pro Features:</h3>
                <ul className="space-y-4">
                  {[
                    'Unlimited player profiles',
                    'Advanced analytics dashboard',
                    'AI-powered insights',
                    'Date scheduling & tracking',
                    'Performance metrics',
                    'Priority support'
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="text-green-400 flex-shrink-0" size={20} />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-white mb-2">$0.99</div>
                <div className="text-gray-400 mb-6">per month</div>
                <button 
                  onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 w-full"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-24 bg-black">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get Instant Access
            </h2>
            <p className="text-gray-400">
              Sign up now and upgrade to unlock all premium features
            </p>
          </div>

          <div className="bg-black border-2 border-green-500 rounded-xl p-8">
            <div className="flex mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  isLogin
                    ? 'bg-green-500 text-black'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  !isLogin
                    ? 'bg-green-500 text-black'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-4 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none transition-colors text-lg"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-4 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none transition-colors text-lg"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-black py-4 rounded-lg font-medium transition-colors text-lg"
              >
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {!isLogin && (
              <p className="text-gray-400 text-sm mt-6 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-4">
              <Heart className="text-white" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Playboi</h3>
            <p className="text-gray-400 mb-6">Level up your dating game</p>
            <div className="text-gray-500 text-sm">
              © 2025 Playboi. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}