
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../store/useAuth";
import { useEffect } from "react";
import { ProfileCompletion } from "./ProfileCompletion";
import { ProfileView } from "./ProfileView";

// Profile completion calculation
interface Auth0User {
  sub?: string;
  name?: string;
  sector?: string;
  phoneNumber?: string;
  email?: string;
  email_verified?: boolean;
  serviceProviderProfile?: {
    sector?: string;
    phoneNumber?: string;
    isVerified?: boolean;
    profile?: {
      basicInfo?: {
        displayName?: string;
        contactInfo?: {
          phone?: string;
        };
      };
    };
  };
}

function getProfileCompletion(user: Auth0User | any): number {
  if (!user) return 0;
  
  let completed = 0;
  
  // Basic profile checks
  const hasName = Boolean(user.name || user.given_name);
  const hasVerifiedEmail = Boolean(user.email && user.email_verified);
  const hasSector = Boolean(user.sector || user.serviceProviderProfile?.sector);
  const hasPhone = Boolean(user.phoneNumber || user.serviceProviderProfile?.phoneNumber);
  const isVerified = Boolean(user.serviceProviderProfile?.isVerified);
  
  if (hasName) completed += 20;
  if (hasVerifiedEmail) completed += 20;
  if (hasSector) completed += 20;
  if (hasPhone) completed += 20;
  if (isVerified) completed += 20;
  
  return completed;
}

export const ProfileLayout = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profileCompletion = getProfileCompletion(auth.userContext);

  useEffect(() => {
    // Re-calculate profile completion when auth state changes
    getProfileCompletion(auth.userContext);
  }, [auth.userContext]);

  // Check if this is the /profile/complete route - always show ProfileCompletion
  const isCompleteRoute = location.pathname === '/profile/complete';

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pb-20 md:pb-0">
      {/* Show ProfileCompletion if it's /profile/complete route OR profile is incomplete */}
      {(isCompleteRoute || profileCompletion < 100) ? (
        <div className="w-full">
          <ProfileCompletion />
        </div>
      ) : (
        <div className="w-full">
          {/* Show ProfileView for current user when profile is complete */}
          <ProfileView />
        </div>
      )}
    </div>
  );
};
