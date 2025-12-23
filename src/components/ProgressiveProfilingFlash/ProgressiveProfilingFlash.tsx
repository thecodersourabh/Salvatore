import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setCurrentStep,
  markStepCompleted,
  setProfilingComplete,
  getUserProfileByEmail,
  updateUserProfile,
} from '../../store/slices/progressiveProfilingSlice';
import PhoneVerification from './PhoneVerification';
import OTPVerification from './OTPVerification';
import UsernameCheck from './UsernameCheck';

interface ProgressiveProfilingFlashProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Progressive Profiling Flash Screen Component
 * Displays for new seller/service provider users on mobile
 * Collects: Phone verification, Username, Sectors/Services
 */
const ProgressiveProfilingFlash: React.FC<ProgressiveProfilingFlashProps> = ({
  onComplete,
  onSkip,
}) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const profiling = useAppSelector((state) => state.profiling);
  // Prefill user data on mount
  useEffect(() => {
    if (auth.user?.email) {
      dispatch(getUserProfileByEmail(auth.user.email));
    }
  }, [auth.user?.email, dispatch]);

  const {
    currentStep,
    //selectedSectors,
    //selectedServices,
    isRequired,
    phoneVerified,
  } = profiling;


  // Auto-hide if not required
  useEffect(() => {
    if (!isRequired) {
      onSkip?.();
      return;
    }
    // If phone is already verified, skip phone/otp steps
    if (phoneVerified && (currentStep === 'phone' || currentStep === 'otp')) {
      dispatch(markStepCompleted('phone'));
      dispatch(setCurrentStep('username'));
    }
  }, [isRequired, onSkip, phoneVerified, currentStep, dispatch]);

  // Handle phone verification sent
  const handlePhoneSent = () => {
    dispatch(setCurrentStep('otp'));
  };

  // Handle OTP verified
  const handleOtpVerified = () => {
    dispatch(markStepCompleted('phone'));
    dispatch(setCurrentStep('username'));
  };

  // Handle username completed
  const handleUsernameSelected = () => {
    // Save username to backend
    if (auth.user?.email && profiling.username) {
      dispatch(updateUserProfile({ email: auth.user.email, phoneVerified: true,  username: profiling.username }));
    }
    dispatch(markStepCompleted('phone'));
    dispatch(markStepCompleted('username'));
    dispatch(setProfilingComplete(true));
  };

  // Handle sectors selected
  // const handleSectorsSelected = async () => {
  //   if (!auth.user?.email) {
  //     console.error('User email not available');
  //     return;
  //   }
  //   try {
  //     await dispatch(updateUserProfile({
  //       email: auth.user.email,
  //      // sectors: selectedSectors,
  //      // services: selectedServices,
  //       profilingComplete: true,
  //     })).unwrap();
  //     dispatch(markStepCompleted('sectors'));
  //     dispatch(setProfilingComplete(true));
  //     onComplete?.();
  //   } catch (error) {
  //     console.error('Failed to save sectors:', error);
  //   }
  // };

  // Back handlers
  const handleBackFromOtp = () => {
    dispatch(setCurrentStep('phone'));
  };

  const handleBackFromUsername = () => {
    dispatch(setCurrentStep('otp'));
  };

  // const handleBackFromSectors = () => {
  //   dispatch(setCurrentStep('username'));
  // };

  // Stepper data removed (no longer used)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950 overflow-y-auto">
      {/* Stepper removed for minimal UI */}

      {/* Animated content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-4 sm:px-0 transition-all duration-500">
        <div className="w-full max-w-lg mx-auto bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl p-4 sm:p-8 mt-4 mb-8 animate-fade-in">
          {currentStep === 'phone' && (
            <PhoneVerification
              onPhoneSent={handlePhoneSent}
              onSkip={onSkip}
            />
          )}
          {currentStep === 'otp' && (
            <OTPVerification
              phoneNumber={profiling.phoneNumber}
              onVerified={handleOtpVerified}
              onBack={handleBackFromOtp}
            />
          )}
          {currentStep === 'username' && (
            <UsernameCheck
              onContinue={handleUsernameSelected}
              onBack={handleBackFromUsername}
            />
          )}
          {/* {currentStep === 'sectors' && (
            <SectorSelection
              onContinue={handleSectorsSelected}
              onBack={handleBackFromSectors}
            />
          )} */}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4 sm:px-6 text-center text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80">
        <p className="flex items-center justify-center gap-2">
          <span className="text-rose-500 dark:text-rose-400">🔒</span>
          Your information is <span className="font-semibold">secure</span> and only used for service verification
        </p>
      </div>
    </div>
  );
};

export default ProgressiveProfilingFlash;
