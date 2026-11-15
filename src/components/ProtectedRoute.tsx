import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProgressiveProfiling } from '../hooks/useProgressiveProfiling';
import { ProgressiveProfilingFlash } from './ProgressiveProfilingFlash';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, accountSetupPending, userCreated, currentRole, error } = useAuth();
  const location = useLocation();
  const { isProfilingRequired, profilingComplete, checkProfilingRequired, markComplete } = useProgressiveProfiling();

  // Check if profiling is required for this user
  useEffect(() => {
    if (isAuthenticated && currentRole === 'seller') {
      checkProfilingRequired(true);
    }
  }, [isAuthenticated, currentRole, checkProfilingRequired]);

  if (loading) {
    // Show loading state while authentication is being verified or user is being created
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  if (accountSetupPending && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="max-w-md text-center" role="alert">
          <p className="font-medium text-gray-900 dark:text-white">We couldn&apos;t finish setting up your account.</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Show profiling flash only for seller accounts that still need profiling
  if (isProfilingRequired && !profilingComplete && currentRole === 'seller') {
    return (
      <ProgressiveProfilingFlash
        onSkip={() => {
          // Skip profiling for now and allow the user to continue
          checkProfilingRequired(false);
          markComplete();
        }}
      />
    );
  }

  // If user is authenticated and user creation is complete,
  // redirect to dashboard if they're on profile, home, or auth pages
  if (isAuthenticated && userCreated && (
    location.pathname === '/profile' || 
    location.pathname === '/home' || 
    location.pathname === '/auth'
  )) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
