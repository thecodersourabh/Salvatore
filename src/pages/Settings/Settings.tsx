import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/translations';

export const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as 'en' | 'hi');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t.settings.title}</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <label 
            htmlFor="language" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t.settings.language}
          </label>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
          >
            <option value="en">{t.settings.english}</option>
            <option value="hi">{t.settings.hindi}</option>
          </select>
        </div>
      </div>
    </div>
  );
};