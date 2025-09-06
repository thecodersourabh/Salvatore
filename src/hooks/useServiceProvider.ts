import { useState, useEffect, useCallback } from 'react';
import { ServiceProviderService } from '../services/serviceProviderService';
import { sectorConfigs } from '../config/sectorConfigs';
import { useAuth } from '../context/AuthContext';
import { User } from '../types/user';
import { UserService } from '../services';

type PortfolioItem = NonNullable<User['portfolio']>[number];

interface UseServiceProviderReturn {
  profile: User | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateAvailability: (availability: User['availability']) => Promise<void>;
  updateServiceAreas: (areas: User['serviceAreas']) => Promise<void>;
  updatePricing: (pricing: User['pricing']) => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, 'id' | 'date'>) => Promise<void>;
  submitVerification: (documentType: string, file: File) => Promise<void>;
  getSectorConfig: () => typeof sectorConfigs[keyof typeof sectorConfigs] | null;
  refresh: () => Promise<void>;
}
export const useServiceProvider = (sector?: string): UseServiceProviderReturn => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) {
      return;
    }

    // If not authenticated, set error
    if (!isAuthenticated || !user?.email) {
      setError(new Error('Please log in to access your provider profile'));
      setLoading(false);
      return;
    }
  }, [authLoading, isAuthenticated, user?.email]);

  const loadProfile = useCallback(async () => {
    if (!user?.email) {
      setError(new Error('Please log in to access your provider profile'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getUserByEmail(user.email);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (updates: Partial<User>) => {
    if (!user?.email) {
      const error = new Error('Please log in to update your profile');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await ServiceProviderService.updateProfile(user.email, updates);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (availability: User['availability']) => {
    if (!user?.email) {
      const error = new Error('Please log in to update your availability');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await ServiceProviderService.updateAvailability(user.email, availability);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update availability'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateServiceAreas = async (areas: User['serviceAreas']) => {
    if (!user?.email) {
      const error = new Error('Please log in to update your service areas');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await ServiceProviderService.updateServiceAreas(user.email, areas);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update service areas'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = async (pricing: User['pricing']) => {
    if (!user?.email) {
      const error = new Error('Please log in to update your pricing');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedPricing = await ServiceProviderService.updatePricing(user.email, pricing);
      if (profile) {
        setProfile({
          ...profile,
          pricing: updatedPricing
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update pricing'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPortfolioItem = async (item: Omit<PortfolioItem, 'id' | 'date'>) => {
    if (!user?.email) {
      const error = new Error('Please log in to add portfolio items');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      await ServiceProviderService.addPortfolioItem(user.email, {
        ...item,
        date: new Date().toISOString()
      });
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add portfolio item'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (documentType: string, file: File) => {
    if (!user?.email) {
      const error = new Error('Please log in to submit verification');
      setError(error);
      throw error;
    }

    try {
      setLoading(true);
      setError(null);
      await ServiceProviderService.submitVerification(user.email, documentType, file);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit verification'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSectorConfig = () => {
    if (!sector) return null;
    return sectorConfigs[sector] || null;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvailability,
    updateServiceAreas,
    updatePricing,
    addPortfolioItem,
    submitVerification,
    getSectorConfig,
    refresh: loadProfile
  };
};
