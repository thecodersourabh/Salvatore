export type Theme = 'light' | 'dark';

export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDarkMode: boolean;
}

export const themeColors = {
    light: {
        primary: '#ffffff',
        secondary: '#f3f4f6',
        text: '#111827',
        accent: '#3b82f6',
        border: '#e5e7eb',
        error: '#ef4444',
        success: '#22c55e',
    },
    dark: {
        primary: '#1f2937',
        secondary: '#111827',
        text: '#f3f4f6',
        accent: '#60a5fa',
        border: '#374151',
        error: '#f87171',
        success: '#4ade80',
    },
};