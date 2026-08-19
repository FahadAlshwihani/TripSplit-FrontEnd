// src/components/LanguageProvider.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleLanguageChange = () => {
      document.documentElement.lang = i18n.language;
      document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    };

    i18n.on('languageChanged', handleLanguageChange);
    handleLanguageChange(); // Initial call

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return children;
};

export default LanguageProvider;
