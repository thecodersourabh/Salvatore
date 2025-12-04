import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ViewModeSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentRole, switchRole, loading } = useAuth();
  const [switching, setSwitching] = useState(false);

  // Don't show switcher if user is not authenticated
  if (!user) return null;

  const isClientView = currentRole === 'customer';
  const isProviderView = currentRole === 'seller';

  const handleViewSwitch = async (view: 'client' | 'provider') => {
    if (switching || loading) return;
    
    console.log('ViewModeSwitcher: Switching to', view, 'Current role:', currentRole);
    setSwitching(true);
    
    try {
      // Switch role first
      const newRole = view === 'client' ? 'customer' : 'seller';
      
      if (currentRole !== newRole) {
        console.log('ViewModeSwitcher: Role change needed from', currentRole, 'to', newRole);
        await switchRole(newRole);
        console.log('ViewModeSwitcher: Role switched successfully');
      } else {
        console.log('ViewModeSwitcher: Already in correct role');
      }
      
      // Then navigate to appropriate view
      const targetPath = view === 'client' ? '/client-home' : '/dashboard';
      console.log('ViewModeSwitcher: Navigating to', targetPath);
      navigate(targetPath);
    } catch (error) {
      console.error('Failed to switch role:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => handleViewSwitch('client')}
        disabled={switching || loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isClientView
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        {switching && !isClientView ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Client</span>
      </button>
      
      <button
        onClick={() => handleViewSwitch('provider')}
        disabled={switching || loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isProviderView
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        {switching && !isProviderView ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Briefcase className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Provider</span>
      </button>
    </div>
  );
};