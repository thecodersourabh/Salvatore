import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, userCreated } = useAuth();
  const location = useLocation();

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
