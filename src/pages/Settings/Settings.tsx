import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../utils/translations';
import { Theme } from '../../types/theme';

export const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, isDarkMode } = useTheme();
  const t = translations[language];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as 'en' | 'hi');
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value as Theme);
  };

  return (
    <div className="container mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">{t.settings.title}</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <label 
            htmlFor="language" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t.settings.language}
          </label>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
          >
            <option value="en">{t.settings.english}</option>
            <option value="hi">{t.settings.hindi}</option>
          </select>
        </div>

        <div className="mb-6">
          <label 
            htmlFor="theme" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t.settings.theme}
          </label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
          >
            <option value="light">{t.settings.themeLight}</option>
            <option value="dark">{t.settings.themeDark}</option>
          </select>
        </div>
      </div>
    </div>
  );
};