
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { StepProvider } from '../../context/StepContext';
import { ProfileCompletion } from "./ProfileCompletion";

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

  useEffect(() => {
    // Calculate profile completion when auth state changes
    getProfileCompletion(auth.userContext);
  }, [auth, auth.userContext]);

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <StepProvider>
        <ProfileCompletion />
      </StepProvider>
      
      {/* Main content */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};
