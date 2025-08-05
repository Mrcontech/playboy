import React, { useState } from 'react';
import { Heart, Users, BarChart3, Calendar, Star, ArrowRight, Check, Mail, Lock, Eye, EyeOff, Smartphone, TrendingUp, Target, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      description: 'Organize your dating prospects with detailed profiles, status tracking, and performance metrics.',
      screenshot: 'https://ygrmtbgwqdfkcwagukpa.supabase.co/storage/v1/object/public/landingpage//Screenshot%202025-08-05%20at%2012.13.17%20PM.png'
    },
    {
      icon: Brain,
      title: 'AI Recaps',
      description: 'Never forget something about your player. Get intelligent summaries and insights about each person in your roster.',
      screenshot: 'https://ygrmtbgwqdfkcwagukpa.supabase.co/storage/v1/object/public/landingpage//Screenshot%202025-08-05%20at%2012.13.49%20PM.png'
    },
    {
      icon: BarChart3,
      title: 'Performance Statistics & Analytics',
      description: 'Track your dating performance with detailed statistics, CPN analysis, and comprehensive performance metrics.',
      screenshot: 'https://ygrmtbgwqdfkcwagukpa.supabase.co/storage/v1/object/public/landingpage//Screenshot%202025-08-05%20at%2012.14.06%20PM.png'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-purple-500/5 to-pink-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-8 shadow-2xl">
              <img 
                src="/Playboi Social 1000x1000.png" 
                alt="Playboi Logo" 
                className="w-16 h-16 object-cover rounded-full"
              />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent">
              Playboi
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              The ultimate dating roster management app. Track your game, analyze your performance, and level up your dating life with professional-grade tools.
            </p>
            
            {/* Hero Screenshot */}
            <div className="max-w-sm mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-purple-500 rounded-3xl blur-xl opacity-30"></div>
                <img 
                  src="https://ygrmtbgwqdfkcwagukpa.supabase.co/storage/v1/object/public/landingpage/Screenshot%202025-08-05%20at%2012.12.52%20PM.png" 
                  alt="Playboi App Dashboard" 
                  className="relative w-full rounded-3xl shadow-2xl border-2 border-green-500/50"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black px-10 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-3"
              >
                <span>Only $0.99/week</span>
                <ArrowRight size={24} />
              </button>
              <button 
                onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-green-500 hover:border-green-400 hover:bg-green-500/10 text-white px-10 py-5 rounded-xl font-bold text-xl transition-all"
              >
                See Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Screenshots */}
      <section id="features-section" className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Everything You Need to Master Your Dating Game
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional-grade tools to organize, analyze, and optimize your dating life like never before.
            </p>
          </div>
          
          <div className="space-y-32">
            {features.map((feature, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                {/* Content */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl w-fit mb-6 shadow-lg">
                    <feature.icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-6">{feature.title}</h3>
                  <p className="text-xl text-gray-400 leading-relaxed mb-8">{feature.description}</p>
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-semibold">Available in Playboi Pro</span>
                  </div>
                </div>
                
                {/* Screenshot */}
                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="relative max-w-sm mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-purple-500 rounded-3xl blur-2xl opacity-20"></div>
                    <img 
                      src={feature.screenshot}
                      alt={`${feature.title} Screenshot`} 
                      className="relative w-full rounded-3xl shadow-2xl border-2 border-green-500/30 hover:border-green-500/60 transition-all duration-300 transform hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white mb-6">
              Start Your Journey Today
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands who've leveled up their dating game
            </p>
          </div>
          
          <div className="bg-black border-2 border-green-500 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-purple-500/5"></div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-8">Playboi Pro Features:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Unlimited player profiles',
                    'Advanced analytics dashboard', 
                    'AI-powered insights',
                    'Date scheduling & tracking',
                    'Performance metrics',
                    'Priority support',
                    'Export data functionality',
                    'Advanced filtering & search'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="text-black" size={14} />
                      </div>
                      <span className="text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-8 mb-8">
                  <div className="text-6xl font-bold text-black mb-2">$0.99</div>
                  <div className="text-black/80 text-lg font-medium">per week</div>
                </div>
                <button 
                  onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 w-full shadow-2xl"
                >
                  Get Started Now
                </button>
                <p className="text-gray-400 text-sm mt-4">Cancel anytime • No commitment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-32 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Get Instant Access
            </h2>
            <p className="text-xl text-gray-400">
              Sign up now and upgrade to unlock all premium features
            </p>
          </div>

          <div className="bg-black border-2 border-green-500 rounded-2xl p-8 shadow-2xl">
            <div className="flex mb-8 bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  isLogin
                    ? 'bg-green-500 text-black shadow-lg'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? 'bg-green-500 text-black shadow-lg'
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
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-4 py-4 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-300 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 text-white pl-12 pr-14 py-4 rounded-xl border border-gray-700 focus:border-green-500 focus:outline-none transition-colors text-lg"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-700 disabled:to-green-800 text-black py-4 rounded-xl font-bold transition-all text-lg shadow-lg transform hover:scale-105"
              >
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account & Start Trial'}
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
      <footer className="bg-black border-t border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6">
              <img 
                src="/Playboi Social 1000x1000.png" 
                alt="Playboi Logo" 
                className="w-12 h-12 object-cover rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Playboi</h3>
            <p className="text-gray-400 mb-8">Level up your dating game</p>
            <div className="text-gray-500 text-sm">
              © 2025 Playboi. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}