import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Zap,
  Scissors,
  Wrench,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Plus,
  Clock
} from "lucide-react";
import { NetworkErrorMessage } from "../../components/ui/NetworkErrorMessage";
import { ErrorType } from "../../services/apiErrorHandler";
import { ServiceCard } from "../../components/ServiceCard";
import { UserService } from "../../services";
import {useSectorTranslation } from '../../hooks/useSectorTranslation';
import {useLanguage } from '../../context/LanguageContext';
import { ServiceSector, User } from "../../types/user";
import { ProfileCompletionAlert } from "../../components/Dashboard/ProfileCompletionAlert";

interface ServiceItem {
  id: number;
  title: string;
  description: string;
  icon: any;
  category: string;
  rating: number;
  totalJobs: number;
  isActive: boolean;
  services: Array<{
    name: string;
    description: string;
  }>;
  skills?: string[];
}

const iconMap: Record<ServiceSector, any> = {
  Technology: Building2,
  electrician: Zap,
  plumber: Wrench,
  carpenter: Building2,
  mechanic: Wrench,
  tailor: Scissors,
  beautician: Scissors,
  cleaner: Building2,
  painter: Building2,
  gardener: Building2,
  tutor: Building2,
  chef: Building2,
  agency: Building2,
  other: Building2
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { getCurrentSectors, translateSector } = useSectorTranslation();
  const { user } = useAuth() as { user: (User & { serviceProviderProfile?: User; sub?: string }) | null };
  const { language } = useLanguage();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [networkError, setNetworkError] = useState<{ type: ErrorType; message: string } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.email) {
        try {
          const userProfile = await UserService.getUserByEmail(user.email);

          // Calculate completion percentage
          let completed = 0;
          if (userProfile?.displayName) completed += 20;
          if (userProfile?.sector) completed += 20;
          if (userProfile?.phone) completed += 20;
          if (Array.isArray(userProfile?.skills) && userProfile.skills.length > 0) completed += 20;
          if (userProfile?.availability) completed += 20;

          setProfileCompletion(completed);
          setNetworkError(null);
        } catch (error) {
          console.error('Error loading profile:', error);
          setNetworkError({
            type: ErrorType.NETWORK,
            message: 'Unable to load your profile. Please check your internet connection.'
          });
        }
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const profile = await UserService.getUserByEmail(user.email) as User;
        
        if (profile?.sector) {
          const sectorServices = getCurrentSectors(language);
          const userSector = profile.sector;
          const translatedSector = translateSector(userSector);
          const sectorData = sectorServices[translatedSector as ServiceSector];
          if (sectorData) {
            const serviceCards = sectorData.services.map((service, index) => {
              return {
                id: index + 1,
                title: service.name,
                description: service.description,
                icon: iconMap[userSector] || Building2,
                category: userSector,
                rating: profile.stats?.rating ?? 4.5,
                totalJobs: profile.stats?.completedJobs ?? 10,
                isActive: true,
                services: [service],
                skills: service.skills || []
              };
            });
            
            setServices(serviceCards);
          }
        }
        setNetworkError(null);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setNetworkError({
          type: ErrorType.NETWORK,
          message: 'Unable to load your services. Please check your internet connection.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const toggleServiceStatus = (serviceId: number): void => {
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      )
    );
  };

  const activeServices = services.filter(service => service.isActive);
  const totalEarnings = activeServices.reduce(
    (sum, service) => sum + (service.totalJobs * 45),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 dark:border-rose-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Network Error Message */}
      {networkError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <NetworkErrorMessage
            error={networkError}
            onRetry={() => {
              setLoading(true);
              setNetworkError(null);
              window.location.reload();
            }}
          />
        </div>
      )}
      {/* Profile Completion Alert */}
      {showProfileAlert && user && profileCompletion !== 100 && (
        <ProfileCompletionAlert onClose={() => setShowProfileAlert(false)} completion={profileCompletion} profile={user} />
      )}

      {/* Hero Dashboard Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                Welcome to Dashboard, {user?.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                Manage your services and grow your business across multiple sectors
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/orders')}
                  className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                >
                  Active Orders
                </button>
                <button className="border border-rose-600 text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors">
                  View Analytics
                </button>
              </div>
            </div>
            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Active Orders</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{activeServices.length}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Total Earnings</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${totalEarnings.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">This Month</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">23 Jobs</p>
                  </div>
                  <Calendar className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">On-time delivery</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">100 %</p>
                  </div>
                  <Clock className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Management Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Your Services
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Manage your service offerings across different sectors
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
        </div>

        {services.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            No services found. Please complete your service provider profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <ServiceCard
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  category={service.category}
                  rating={service.rating}
                  totalJobs={service.totalJobs}
                  isActive={service.isActive}
                  onToggle={() => toggleServiceStatus(service.id)}
                  services={service.services}
                  skills={service.skills}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-rose-600" />
              </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">View Bookings</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Check your upcoming appointments and schedule</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analytics</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Track your performance and earnings</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-rose-600" />
              </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Payments</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Manage your earnings and payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
