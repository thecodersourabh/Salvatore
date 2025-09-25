import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Zap,
  Scissors,
  Wrench,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Plus
} from "lucide-react";
import { ServiceCard } from "../../components/ServiceCard";
import { UserService } from "../../services";
import { getAllSectorServices, Service } from "../../utils/sectorServices";
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
  const { user } = useAuth() as { user: (User & { serviceProviderProfile?: User }) | null };
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);

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
        } catch (error) {
          console.error('Error loading profile:', error);
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
          const sectorServices = getAllSectorServices();
          const userSector = profile.sector;
          const sectorData = sectorServices[userSector as ServiceSector];
          console.log('User Sector:', userSector);
          console.log('Sector Services Data:', sectorServices);

          if (sectorData) {
            console.log('Sector Data:', sectorData);
            console.log('Sector Services:', sectorData.services);
            const serviceCards = sectorData.services.map((service, index) => {
              console.log(`Service ${service.name} skills:`, service.skills);
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
      } catch (error) {
        console.error('Error fetching user profile:', error);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-rose-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Profile Completion Alert */}
      {showProfileAlert && user && profileCompletion !== 100 && (
        <ProfileCompletionAlert onClose={() => setShowProfileAlert(false)} completion={profileCompletion} profile={user} />
      )}

      {/* Hero Dashboard Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Welcome to Dashboard
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Manage your services and grow your business across multiple sectors
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-rose-700 transition-colors">
                  Add New Service
                </button>
                <button className="border border-rose-600 text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-rose-50 transition-colors">
                  View Analytics
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Services</p>
                    <p className="text-xl font-bold text-gray-900">{activeServices.length}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Earnings</p>
                    <p className="text-xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">This Month</p>
                    <p className="text-xl font-bold text-gray-900">23 Jobs</p>
                  </div>
                  <Calendar className="h-6 w-6 text-rose-600" />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Your Services
            </h2>
            <p className="text-sm text-gray-600">
              Manage your service offerings across different sectors
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
        </div>

        {services.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No services found. Please complete your service provider profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
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
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-rose-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">View Bookings</h4>
              <p className="text-gray-600 text-xs">Check your upcoming appointments and schedule</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-rose-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Analytics</h4>
              <p className="text-gray-600 text-xs">Track your performance and earnings</p>
            </div>
            
            <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-rose-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Payments</h4>
              <p className="text-gray-600 text-xs">Manage your earnings and payments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
