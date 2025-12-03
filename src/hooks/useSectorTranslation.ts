import { useLanguage } from './useLanguage';
import { useMemo, useCallback } from 'react';
import englishSectors from '../config/sectorServices.json';
import hindiSectors from '../config/sectorServices.hi.json';

interface ServiceSkill {
  name: string;
  description: string;
  skills: string[];
}

interface SectorData {
  description: string;
  services: ServiceSkill[];
}

type SectorServices = Record<string, SectorData>;
type EnglishSectorKey = keyof typeof englishSectors;
type HindiSectorKey = keyof typeof hindiSectors;

// Memoize sector keys
const englishSectorKeys = Object.keys(englishSectors) as EnglishSectorKey[];
const hindiSectorKeys = Object.keys(hindiSectors) as HindiSectorKey[];

// Create translations mapping using a predefined mapping table
const sectorKeyMappings: Record<string, string> = {
  'Technology': 'टेक्नोलॉजी',
  'Electrician': 'इलेक्ट्रीशियन',
  'Plumber': 'प्लंबर',
  'Carpenter': 'कारपेंटर',
  'Mechanic': 'मेकैनिक',
  'Tailor': 'टेलर',
  'Beautician': 'ब्यूटीशियन',
  'Cleaner': 'क्लीनर',
  'Painter': 'पेंटर',
  'Gardener': 'गार्डनर',
  'Tutor': 'ट्यूटर',
  'Chef': 'शेफ',
  'Agency': 'एजेंसी',
  'Courier': 'कूरियर',
  'Healthcare': 'हेल्थकेयर',
  'Astrologer': 'ज्योतिषी',
  'Other': 'अन्य'
};

// Create translations mapping using the predefined mappings
const knownTranslations: Record<EnglishSectorKey, HindiSectorKey> = englishSectorKeys.reduce((acc, enKey) => {
  const hiKey = sectorKeyMappings[enKey];
  if (hiKey && hindiSectorKeys.includes(hiKey as HindiSectorKey)) {
    acc[enKey] = hiKey as HindiSectorKey;
  } else {
    console.warn(`No mapping found for sector: ${enKey}`);
  }
  return acc;
}, {} as Record<EnglishSectorKey, HindiSectorKey>);

// Create reverse mapping for Hindi to English translations
const reverseTranslations: Record<HindiSectorKey, EnglishSectorKey> = Object.entries(knownTranslations).reduce((acc, [en, hi]) => {
  acc[hi as HindiSectorKey] = en as EnglishSectorKey;
  return acc;
}, {} as Record<HindiSectorKey, EnglishSectorKey>);

// Hook for sector translations
export const useSectorTranslation = () => {
  const { language } = useLanguage();
  
  const toEnglish = useCallback((sector: string): string => {
    if (!sector) return '';
    
    const normalizedSector = sector.trim();
    
    // If it's already in English sectors
    if (englishSectorKeys.includes(normalizedSector as EnglishSectorKey)) {
      return normalizedSector;
    }
    
    // Try to find Hindi to English translation
    const englishSector = reverseTranslations[normalizedSector as HindiSectorKey];
    if (englishSector) {
      return englishSector;
    }
    
    // Log warning and return original if no translation found
    console.warn(`Could not translate sector to English: ${sector}`);
    return normalizedSector;
  }, []); // No dependencies as it uses only constant values
  
  const toHindi = useCallback((sector: string): string => {
    if (!sector) return '';
    
    const normalizedSector = sector.trim();
    
    // If it's already in Hindi sectors
    if (hindiSectorKeys.includes(normalizedSector as HindiSectorKey)) {
      return normalizedSector;
    }
    
    // Try to find English to Hindi translation
    const hindiSector = knownTranslations[normalizedSector as EnglishSectorKey];
    if (hindiSector) {
      return hindiSector;
    }
    
    // Log warning and return original if no translation found
    console.warn(`Could not translate sector to Hindi: ${sector}`);
    return normalizedSector;
  }, []); // No dependencies as it uses only constant values
  
  const translateSector = useCallback((sector: string): string => {
    return language === 'en' ? toEnglish(sector) : toHindi(sector);
  }, [language, toEnglish, toHindi]);
  
  const getCurrentSectors = useCallback((lang: 'en' | 'hi'): SectorServices => {
    return lang === 'en' ? englishSectors : hindiSectors;
  }, []);
  
  const sectorNames = useMemo(() => {
    const currentSectors = getCurrentSectors(language);
    const sectorList = Object.keys(currentSectors);
    
    if (language === 'en') {
      return sectorList;
    }
    
    // For Hindi, translate all English sectors
    return sectorList.map(sector => toHindi(sector)).filter(Boolean);
  }, [language, getCurrentSectors, toHindi]);
  
  return {
    getCurrentSectors,
    translateSector,
    toEnglish,
    toHindi,
    getSectorNames: useCallback(() => sectorNames, [sectorNames])
  };
};