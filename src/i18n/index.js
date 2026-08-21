import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

// Both supported languages are bundled and preloaded — TripSplit only ships English and Arabic,
// so treating them as remote content (fetched over HTTP on every switch) bought nothing but an
// avoidable network round trip. changeLanguage() now only ever touches resources already in memory,
// so switching is synchronous from the app's point of view.
//
// LanguageDetector only checks/writes localStorage (not navigator/cookie/etc.) — an explicit
// choice persists across refresh, but a first-time visitor still gets fallbackLng ('en') rather
// than the browser's OS/Accept-Language guess.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    resources: { en: { translation: en }, ar: { translation: ar } },
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], caches: ['localStorage'], lookupLocalStorage: 'tripsplit:language' },
  });

export default i18n;
