import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  CheckCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';

interface QuickServiceProvider {
  id: string;
  name: string;
  rating: number;
  responseTime: string;
  distance: number;
  isAvailable: boolean;
  price: number;
  skills: string[];
  avatar?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  priceRange: string;
}

export const QuickService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useLocation();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);

  const quickCategories: ServiceCategory[] = [
    {
      id: 'electrical',
      name: 'Electrical Emergency',
      description: 'Power outage, short circuit, electrical fault',
      icon: <Zap className="h-6 w-6" />,
      estimatedTime: '30-60 mins',
      priceRange: '₹500-2000'
    },
    {
      id: 'plumbing',
      name: 'Plumbing Emergency',
      description: 'Water leak, blocked drain, pipe burst',
      icon: <AlertCircle className="h-6 w-6" />,
      estimatedTime: '20-45 mins',
      priceRange: '₹400-1500'
    },
    {
      id: 'cleaning',
      name: 'Urgent Cleaning',
      description: 'Pre-event cleaning, deep cleaning',
      icon: <CheckCircle className="h-6 w-6" />,
      estimatedTime: '1-3 hours',
      priceRange: '₹300-1000'
    },
    {
      id: 'tech',
      name: 'Tech Support',
      description: 'Computer repair, network issue, device setup',
      icon: <Zap className="h-6 w-6" />,
      estimatedTime: '45-90 mins',
      priceRange: '₹600-2500'
    }
  ];

  const [availableProviders] = useState<QuickServiceProvider[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      rating: 4.8,
      responseTime: '15 mins',
      distance: 1.2,
      isAvailable: true,
      price: 800,
      skills: ['Electrical repair', 'Emergency service', 'Smart home']
    },
    {
      id: '2',
      name: 'Amit Singh',
      rating: 4.9,
      responseTime: '20 mins',
      distance: 2.1,
      isAvailable: true,
      price: 600,
      skills: ['Plumbing', 'Emergency repair', 'Water systems']
    },
    {
      id: '3',
      name: 'Priya Sharma',
      rating: 4.7,
      responseTime: '25 mins',
      distance: 1.8,
      isAvailable: false,
      price: 400,
      skills: ['Deep cleaning', 'Sanitization', 'Quick service']
    }
  ]);

  const handleBookService = async () => {
    setIsLoading(true);
    
    // Simulate booking API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to order tracking
    navigate('/orders/quick-service-123', {
      state: {
        serviceType: 'quick-service',
        provider: availableProviders.find(p => p.id === selectedProvider),
        category: quickCategories.find(c => c.id === selectedCategory),
        urgency: urgencyLevel,
        description,
        bookingId: 'QS' + Date.now()
      }
    });
    
    setIsLoading(false);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Service</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get immediate help from nearby professionals</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-rose-600" />
              <span className="text-sm font-medium text-rose-600">Fast Response</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {num}
                </div>
                {num < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > num ? 'bg-rose-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Service Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What do you need help with?</h2>
              <p className="text-gray-600 dark:text-gray-300">Select the type of service you need immediately</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedCategory === category.id
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      selectedCategory === category.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{category.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {category.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {category.priceRange}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Urgency Level */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">How urgent is this?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { level: 'normal', label: 'Normal', desc: 'Within today', extra: '' },
                  { level: 'urgent', label: 'Urgent', desc: 'Within 2 hours', extra: '+₹100 fee' },
                  { level: 'emergency', label: 'Emergency', desc: 'Immediate', extra: '+₹300 fee' }
                ].map((option) => (
                  <button
                    key={option.level}
                    onClick={() => setUrgencyLevel(option.level as any)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      urgencyLevel === option.level
                        ? getUrgencyColor(option.level).replace('100', '50').replace('20', '50')
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{option.desc}</div>
                    {option.extra && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.extra}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block font-semibold text-gray-900 dark:text-white mb-3">
                Describe your problem (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide more details about what you need help with..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                rows={4}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedCategory}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors"
            >
              Find Available Providers
            </button>
          </div>
        )}

        {/* Step 2: Select Provider */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Available Providers</h2>
              <p className="text-gray-600 dark:text-gray-300">Choose from nearby professionals ready to help</p>
            </div>

            <div className="space-y-4">
              {availableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedProvider === provider.id
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                  } ${!provider.isAvailable ? 'opacity-60' : ''}`}
                  onClick={() => provider.isAvailable && setSelectedProvider(provider.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-purple-100 dark:from-rose-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                        {!provider.isAvailable && (
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg text-xs">
                            Busy
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{provider.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{provider.responseTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{provider.distance}km away</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {provider.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{provider.price}/hr
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                        disabled={!provider.isAvailable}
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                        disabled={!provider.isAvailable}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedProvider}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors"
              >
                Continue to Booking
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Booking */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Your Booking</h2>
              <p className="text-gray-600 dark:text-gray-300">Review your quick service request details</p>
            </div>

            {/* Booking Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Booking Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Service:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quickCategories.find(c => c.id === selectedCategory)?.name}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Provider:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {availableProviders.find(p => p.id === selectedProvider)?.name}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Urgency:</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getUrgencyColor(urgencyLevel)}`}>
                    {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Expected Arrival:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {availableProviders.find(p => p.id === selectedProvider)?.responseTime}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Location:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {location?.address || 'Current Location'}
                  </span>
                </div>

                {description && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-300 block mb-2">Description:</span>
                    <p className="text-gray-900 dark:text-white text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Price Breakdown</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Base Rate:</span>
                  <span className="text-gray-900 dark:text-white">
                    ₹{availableProviders.find(p => p.id === selectedProvider)?.price}/hr
                  </span>
                </div>
                
                {urgencyLevel === 'urgent' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Urgent Fee:</span>
                    <span className="text-gray-900 dark:text-white">₹100</span>
                  </div>
                )}
                
                {urgencyLevel === 'emergency' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Emergency Fee:</span>
                    <span className="text-gray-900 dark:text-white">₹300</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Estimated Total:</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    ₹{(availableProviders.find(p => p.id === selectedProvider)?.price || 0) + 
                      (urgencyLevel === 'urgent' ? 100 : urgencyLevel === 'emergency' ? 300 : 0)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  *Final amount may vary based on actual time spent and materials used
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleBookService}
                disabled={isLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};