import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setOtpCode,
  clearOtpError,
  verifyOtp,
  sendPhoneVerification,
} from '../../store/slices/progressiveProfilingSlice';
import { VerificationService } from '../../services/verificationService';

interface OTPVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onBack?: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  phoneNumber,
  onVerified,
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const {
    otpCode,
    otpVerifying,
    otpError,
    otpAttempts,
    maxOtpAttempts,
    otpSentAt,
  } = useAppSelector((state) => state.profiling);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Format phone for display
  const formattedPhone = VerificationService.formatPhoneForDisplay(phoneNumber);

  // OTP expiry timer
  useEffect(() => {
    if (!otpSentAt) return;

    const expiryTime = VerificationService.getOTPExpiryTime();
    const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
    const remaining = Math.max(0, expiryTime - elapsed);

    setTimeRemaining(remaining);
    setCanResend(remaining === 0);

    if (remaining === 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSentAt]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    dispatch(setOtpCode(value));
    if (otpError) {
      dispatch(clearOtpError());
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode || otpCode.length !== 6) {
      return;
    }

    try {
      const result = await dispatch(
        verifyOtp({
          phoneNumber,
          otpCode,
        })
      ).unwrap();

      if (result.verified) {
        onVerified();
      }
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      await dispatch(sendPhoneVerification({ phoneNumber })).unwrap();
      setCanResend(false);
      setTimeRemaining(VerificationService.getOTPExpiryTime());
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    } finally {
      setIsResending(false);
    }
  };

  const isMaxAttemptsExceeded = otpAttempts >= maxOtpAttempts;
  const isFormValid = otpCode.length === 6;

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Your Number
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          We sent a 6-digit code to <br />
          <span className="font-semibold text-gray-900 dark:text-white">
            {formattedPhone}
          </span>
        </p>
      </div>

      {isMaxAttemptsExceeded ? (
        // Max attempts exceeded
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium">
            You've exceeded the maximum number of attempts. Please request a new code.
          </p>
        </div>
      ) : (
        // OTP input form
        <form onSubmit={handleVerify} className="space-y-4">
          {/* OTP Input */}
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Enter verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otpCode}
              onChange={handleOtpChange}
              maxLength={6}
              disabled={otpVerifying || isMaxAttemptsExceeded}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
            />
          </div>

          {/* Error message */}
          {otpError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                {otpError}
              </p>
              {otpAttempts < maxOtpAttempts && (
                <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                  Attempts remaining: {maxOtpAttempts - otpAttempts}
                </p>
              )}
            </div>
          )}

          {/* Timer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {timeRemaining > 0 ? (
              <p>
                Code expires in{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <p className="text-orange-600 dark:text-orange-400">Code has expired</p>
            )}
          </div>

          {/* Verify button */}
          <button
            type="submit"
            disabled={!isFormValid || otpVerifying || isMaxAttemptsExceeded}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {otpVerifying && (
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
            <span>{otpVerifying ? 'Verifying...' : 'Verify Code'}</span>
          </button>

          {/* Resend button */}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full py-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium rounded-lg transition-colors border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className="w-full py-2 text-gray-500 dark:text-gray-400 font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 cursor-not-allowed"
            >
              Resend code in {Math.floor(timeRemaining / 60)}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </button>
          )}
        </form>
      )}

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="w-full mt-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ← Back
        </button>
      )}

      {/* Help text */}
      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Didn't receive the code?{' '}
          <a
            href="mailto:support@salvatore.com"
            className="text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
