import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setUsername,
  checkUsernameAvailability,
} from '../../store/slices/progressiveProfilingSlice';

interface UsernameCheckProps {
  onContinue: () => void;
  onBack?: () => void;
}

const UsernameCheck: React.FC<UsernameCheckProps> = ({ onContinue, onBack }) => {
  const dispatch = useAppDispatch();
  const {
    username,
    usernameAvailable,
    usernameChecking,
    usernameError,
  } = useAppSelector((state : any) => state.profiling);
  const originalUsername = useAppSelector((state) => state.profiling.username);

  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Auto-check username availability after user stops typing
  useEffect(() => {
    if (!username) {
      setHasChecked(false);
      return;
    }

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Check validity first
    if (username.length < 3) {
      return;
    }

    if (!isUsernameValid(username)) {
      return;
    }

    // Set timeout to check availability
    const timeout = setTimeout(() => {
      dispatch(checkUsernameAvailability({ username }));
      setHasChecked(true);
    }, 500); // Debounce for 500ms

    setTypingTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [username, dispatch]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toLowerCase().trim();
    // Allow only alphanumeric and underscore
    value = value.replace(/[^a-z0-9_]/g, '');
    // Max 30 characters
    value = value.slice(0, 30);
    dispatch(setUsername(value));
  };

  const isUsernameValid = (user: string): boolean => {
    // Username: 3-30 characters, alphanumeric and underscore, no spaces
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    return usernameRegex.test(user);
  };

  // Allow user to keep their existing username if it is the original prefilled one (skip all validation if not changed)
  const isFormValid =
    (originalUsername && username === originalUsername && hasChecked === false)
    || (
      username &&
      isUsernameValid(username) &&
      usernameAvailable === true &&
      !usernameChecking
    );

  const showAvailableCheck =
    username && isUsernameValid(username) && hasChecked && !usernameChecking;

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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Choose Your Username
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Your unique identifier on Salvatore
        </p>
      </div>

      {/* Username form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFormValid) {
            onContinue();
          }
        }}
        className="space-y-4"
      >
        {/* Username input */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={handleUsernameChange}
              disabled={usernameChecking}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors dark:bg-gray-900 dark:text-white"
            />

            {/* Status indicator */}
            {username && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {usernameChecking && (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
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

                {showAvailableCheck && usernameAvailable && (
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}

                {showAvailableCheck && !usernameAvailable && (
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Username requirements */}
          <div className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <svg
                className={`w-4 h-4 ${
                  username.length >= 3
                    ? 'text-green-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>3-30 characters</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className={`w-4 h-4 ${
                  /^[a-z0-9_]*$/.test(username)
                    ? 'text-green-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Letters, numbers, and underscore only</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className={`w-4 h-4 ${
                  usernameAvailable === true
                    ? 'text-green-500'
                    : usernameAvailable === false
                    ? 'text-red-500'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                {usernameAvailable === true
                  ? 'Available'
                  : usernameAvailable === false
                  ? 'Already taken'
                  : 'Checking availability...'}
              </span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {usernameError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">
              {usernameError}
            </p>
          </div>
        )}

        {/* Continue button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
        >
          <span>Continue</span>
        </button>

        {/* Back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← Back
          </button>
        )}
      </form>

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> Choose a memorable username that reflects your business or personal brand.
        </p>
      </div>
    </div>
  );
};

export default UsernameCheck;
