import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeContextType, themeColors } from '../types/theme';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        const loadTheme = async () => {
            const { value } = await Preferences.get({ key: 'theme' });
            if (value) {
                setTheme(value as Theme);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        const updateTheme = async () => {
            const shouldUseDark = theme === 'dark';
            setIsDarkMode(shouldUseDark);

            // Update document theme
            document.documentElement.classList.toggle('dark', shouldUseDark);

            // Update status bar for mobile
            if (Capacitor.isNativePlatform()) {
                try {
                    if (shouldUseDark) {
                        await StatusBar.setStyle({ style: Style.Dark });
                        await StatusBar.setBackgroundColor({ color: themeColors.dark.primary });
                    } else {
                        await StatusBar.setStyle({ style: Style.Light });
                        await StatusBar.setBackgroundColor({ color: themeColors.light.primary });
                    }
                } catch (error) {
                    console.error('Error updating status bar:', error);
                }
            }

            // Save theme preference
            await Preferences.set({ key: 'theme', value: theme });
        };

        updateTheme();
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};