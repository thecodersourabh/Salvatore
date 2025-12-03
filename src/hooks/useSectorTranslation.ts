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
    
    let normalizedSector = sector.trim();
    
    // Try with original case first
    if (englishSectorKeys.includes(normalizedSector as EnglishSectorKey)) {
      return normalizedSector;
    }
    
    // Try with capitalized first letter (most common case)
    const capitalizedSector = normalizedSector.charAt(0).toUpperCase() + normalizedSector.slice(1).toLowerCase();
    if (englishSectorKeys.includes(capitalizedSector as EnglishSectorKey)) {
      return capitalizedSector;
    }
    
    // Try to find case-insensitive match
    const caseInsensitiveMatch = englishSectorKeys.find(
      key => key.toLowerCase() === normalizedSector.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }
    
    // Try to find Hindi to English translation
    const englishSector = reverseTranslations[normalizedSector as HindiSectorKey];
    if (englishSector) {
      return englishSector;
    }
    
    // Handle common variations and fallbacks
    const sectorMapping: Record<string, string> = {
      'technology': 'Technology',
      'tech': 'Technology',
      'electrician': 'Electrician',
      'electric': 'Electrician',
      'electrical': 'Electrician',
      'plumber': 'Plumber',
      'plumbing': 'Plumber',
      'carpenter': 'Carpenter',
      'carpentry': 'Carpenter',
      'mechanic': 'Mechanic',
      'mechanical': 'Mechanic',
      'tailor': 'Tailor',
      'tailoring': 'Tailor',
      'stitching': 'Tailor',
      'beautician': 'Beautician',
      'beauty': 'Beautician',
      'salon': 'Beautician',
      'cleaner': 'Cleaner',
      'cleaning': 'Cleaner',
      'painter': 'Painter',
      'painting': 'Painter',
      'gardener': 'Gardener',
      'gardening': 'Gardener',
      'tutor': 'Tutor',
      'teaching': 'Tutor',
      'education': 'Tutor',
      'chef': 'Chef',
      'cooking': 'Chef',
      'catering': 'Chef',
      'agency': 'Agency',
      'courier': 'Courier',
      'delivery': 'Courier',
      'shipping': 'Courier',
      'healthcare': 'Healthcare',
      'health': 'Healthcare',
      'medical': 'Healthcare',
      'astrologer': 'Astrologer',
      'astrology': 'Astrologer',
      'other': 'Other',
      'service': 'Other',
      'services': 'Other'
    };
    
    const mappedSector = sectorMapping[normalizedSector.toLowerCase()];
    if (mappedSector) {
      return mappedSector;
    }
    
    // If no translation found, return capitalized version
    return capitalizedSector;
  }, []); // No dependencies as it uses only constant values
  
  const toHindi = useCallback((sector: string): string => {
    if (!sector) return '';
    
    let normalizedSector = sector.trim();
    
    // If it's already in Hindi sectors
    if (hindiSectorKeys.includes(normalizedSector as HindiSectorKey)) {
      return normalizedSector;
    }
    
    // Try with capitalized first letter first
    const capitalizedSector = normalizedSector.charAt(0).toUpperCase() + normalizedSector.slice(1).toLowerCase();
    
    // Try to find English to Hindi translation using the capitalized version
    const hindiSector = knownTranslations[capitalizedSector as EnglishSectorKey];
    if (hindiSector) {
      return hindiSector;
    }
    
    // Try case-insensitive match
    const caseInsensitiveMatch = Object.keys(knownTranslations).find(
      key => key.toLowerCase() === normalizedSector.toLowerCase()
    );
    if (caseInsensitiveMatch) {
      const hindiMatch = knownTranslations[caseInsensitiveMatch as EnglishSectorKey];
      if (hindiMatch) return hindiMatch;
    }
    
    // Return original if no translation found (could be already in correct format)
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