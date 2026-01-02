import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

// Get initial language from browser locale or default to 'fr'
const getBrowserLanguage = () => {
  if (typeof window !== 'undefined') {
    // Check if running in browser
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && ['en', 'fr'].includes(urlLang)) {
      return urlLang;
    }

    // Check path for locale (Next.js i18n routing)
    const pathMatch = /^\/(en|fr)\//.exec(window.location.pathname);
    if (pathMatch) {
      return pathMatch[1];
    }
  }
  return 'fr';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      }
    },
    lng: getBrowserLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
