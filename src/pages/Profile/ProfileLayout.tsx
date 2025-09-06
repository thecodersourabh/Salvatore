
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { StepProvider } from '../../context/StepContext';
import { ProfileCompletion } from "./ProfileCompletion";
import { ProfileUpdate } from "../../components/ProfileUpdate/ProfileUpdate";

// Simple profile completion calculation (expand as needed)
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

function getProfileCompletion(user: Auth0User | any) {
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
  
  // Create array of missing items
  const missingItems = [];
  if (!hasName) missingItems.push('name');
  if (!hasVerifiedEmail) missingItems.push('verified email');
  if (!hasSector) missingItems.push('sector');
  if (!hasPhone) missingItems.push('phone number');
  if (!isVerified) missingItems.push('service provider verification');

  // Log detailed completion info
  const completionDetails = {
    completed,
    missingForCompletion: missingItems,
    checks: {
      name: { value: hasName, source: user.name || user.given_name },
      email: { value: hasVerifiedEmail, email: user.email, verified: user.email_verified },
      sector: { value: hasSector, source: user.sector || user.serviceProviderProfile?.sector },
      phone: { value: hasPhone, source: user.phoneNumber || user.serviceProviderProfile?.phoneNumber },
      verified: { value: isVerified, source: user.serviceProviderProfile?.isVerified }
    },
    rawUser: { ...user }
  };
  
  console.log('📊 ProfileLayout: Completion calculation: ' + JSON.stringify(completionDetails, null, 2));
  
  return completed;
}

export const ProfileLayout = () => {
  const auth = useAuth();


  useEffect(() => {
    console.log('🔍 ProfileLayout: Auth state:', auth);
    console.log('🔍 ProfileLayout: User data:', auth.userContext);
    getProfileCompletion(auth.userContext);
  }, [auth, auth.userContext]);

  return (
    <div className="min-h-screen flex flex-col">
      <StepProvider>
          <ProfileCompletion />
      </StepProvider>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};
