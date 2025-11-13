import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to handle hardware back button on mobile devices
 * @param isOpen - Whether the modal/component is open
 * @param onClose - Function to call when back button is pressed
 * @param priority - Priority level for back button handling (higher numbers = higher priority)
 */
export const useBackButton = (
  isOpen: boolean,
  onClose: () => void,
  priority: number = 1
) => {
  useEffect(() => {
    if (!isOpen || !Capacitor.isNativePlatform()) {
      return;
    }

    let backButtonListener: any = null;

    const setupBackButtonHandler = async () => {
      try {
        backButtonListener = await App.addListener('backButton', () => {
          onClose();
        });
      } catch (error) {
        // Not on mobile platform or listener setup failed, ignore
        console.warn('Back button listener setup failed:', error);
      }
    };

    void setupBackButtonHandler();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [isOpen, onClose, priority]);
};