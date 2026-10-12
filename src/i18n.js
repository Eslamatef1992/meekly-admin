import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLng = localStorage.getItem('lng') || 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

function applyDir(lng) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
}
applyDir(savedLng);
i18n.on('languageChanged', applyDir);

export default i18n;
