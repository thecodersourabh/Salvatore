import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setTheme, selectTheme, selectIsDarkMode } from '../slices/themeSlice';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { themeColors } from '../../types/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const isDarkMode = useAppSelector(selectIsDarkMode);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { value } = await Preferences.get({ key: 'theme' });
        if (value && (value === 'light' || value === 'dark')) {
          dispatch(setTheme(value));
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, [dispatch]);

  // Apply theme changes to DOM and native status bar
  useEffect(() => {
    const updateTheme = async () => {
      try {
        // Update document theme class for Tailwind CSS dark mode
        document.documentElement.classList.toggle('dark', isDarkMode);

        // Update status bar for mobile platforms
        if (Capacitor.isNativePlatform()) {
          try {
            if (isDarkMode) {
              await StatusBar.setStyle({ style: Style.Dark });
              await StatusBar.setBackgroundColor({ color: themeColors.dark.primary });
            } else {
              await StatusBar.setStyle({ style: Style.Light });
              await StatusBar.setBackgroundColor({ color: themeColors.light.primary });
            }
          } catch (statusError) {
            console.warn('Error updating status bar:', statusError);
          }
        }

        // Save theme preference
        await Preferences.set({ key: 'theme', value: theme });
      } catch (error) {
        console.warn('Error updating theme:', error);
      }
    };

    updateTheme();
  }, [theme, isDarkMode]);

  return <>{children}</>;
};