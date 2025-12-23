import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setPhoneNumber,
  clearPhoneError,
  sendPhoneVerification,
} from '../../store/slices/progressiveProfilingSlice';
import { VerificationService } from '../../services/verificationService';

interface PhoneVerificationProps {
  onPhoneSent: () => void;
  onSkip?: () => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onPhoneSent, onSkip }) => {
  const dispatch = useAppDispatch();
  console.log('PhoneVerification component rendered');
  const { phoneNumber, phoneSending, phoneError } = useAppSelector(
    (state) => state.profiling
  );

  const [localError, setLocalError] = useState<string>('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    // Allow max 13 digits (for international numbers)
    value = value.slice(0, 13);
    dispatch(setPhoneNumber(value));
    setLocalError('');
    if (phoneError) {
      dispatch(clearPhoneError());
    }
  };

  const getPhoneDisplay = (): string => {
    if (!phoneNumber) return '';
    return VerificationService.formatPhoneForDisplay(phoneNumber);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    setLocalError('');

    // Validate phone number
    if (!phoneNumber) {
      setLocalError('Please enter your phone number');
      return;
    }

    if (!VerificationService.isValidPhoneNumber(phoneNumber)) {
      setLocalError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    try {
      await dispatch(sendPhoneVerification({ phoneNumber })).unwrap();
      onPhoneSent();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const isFormValid =
    phoneNumber && VerificationService.isValidPhoneNumber(phoneNumber);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full mx-auto mb-4">
          <svg
            className="w-6 h-6 text-rose-600 dark:text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Verify Your Phone
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          We'll send you a verification code via SMS
        </p>
      </div>

      {/* Phone form */}
      <form onSubmit={handleSendOTP} className="space-y-4">
        {/* Phone input */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Phone Number
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-400 font-medium">+</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="91 XXXXX XXXXX"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={phoneSending}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:text-white"
            />
          </div>
          {phoneNumber && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {getPhoneDisplay()}
            </p>
          )}
        </div>

        {/* Error message */}
        {(phoneError || localError) && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">
              {phoneError || localError}
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Your phone number will be verified and used for account recovery and important notifications.
          </p>
        </div>

        {/* Send OTP button */}
        <button
          type="submit"
          disabled={!isFormValid || phoneSending}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {phoneSending && (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          <span>{phoneSending ? 'Sending...' : 'Send Verification Code'}</span>
        </button>

        {/* Skip button */}
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Skip for now
          </button>
        )}
      </form>

      {/* Privacy notice */}
      <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>
          By continuing, you agree to our{' '}
          <a href="#" className="text-rose-600 dark:text-rose-400 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-rose-600 dark:text-rose-400 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default PhoneVerification;
