import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ViewModeSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show switcher if user is not authenticated
  if (!user) return null;

  const isClientView = location.pathname === '/' || location.pathname.startsWith('/client') || location.pathname.startsWith('/quick') || location.pathname.startsWith('/solution');
  const isProviderView = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/add-product');

  const handleViewSwitch = (view: 'client' | 'provider') => {
    if (view === 'client') {
      navigate('/client-home');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => handleViewSwitch('client')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isClientView
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Client</span>
      </button>
      
      <button
        onClick={() => handleViewSwitch('provider')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isProviderView
            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Briefcase className="h-4 w-4" />
        <span className="hidden sm:inline">Provider</span>
      </button>
    </div>
  );
};