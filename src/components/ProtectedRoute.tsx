import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProgressiveProfiling } from '../hooks/useProgressiveProfiling';
import { ProgressiveProfilingFlash } from './ProgressiveProfilingFlash';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, userCreated, currentRole } = useAuth();
  const location = useLocation();
  const { isProfilingRequired, profilingComplete, checkProfilingRequired, reset } = useProgressiveProfiling();

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

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Show profiling flash if required and not completed
  if (isProfilingRequired && !profilingComplete) {
    return (
      <ProgressiveProfilingFlash
        onComplete={() => {
          // Profiling complete, continue to the page
          // Flash will unmount automatically
        }}
        onSkip={() => {
          // Skip profiling (can be done later)
          reset();
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
