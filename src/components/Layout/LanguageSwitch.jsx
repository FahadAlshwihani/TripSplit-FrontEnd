import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitch = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.language === 'ar' ? 'ar' : 'en';
  return (
    <div className="utility-switch" role="group" aria-label={t('language.groupLabel')}>
      <button
        type="button"
        className={`utility-switch__option ${current === 'en' ? 'is-active' : ''}`}
        onClick={() => i18n.changeLanguage('en')}
        aria-pressed={current === 'en'}
        aria-label={t('language.switchToEnglish')}
        title={t('language.switchToEnglish')}
        lang="en"
      >
        EN
      </button>
      <button
        type="button"
        className={`utility-switch__option ${current === 'ar' ? 'is-active' : ''}`}
        onClick={() => i18n.changeLanguage('ar')}
        aria-pressed={current === 'ar'}
        aria-label={t('language.switchToArabic')}
        title={t('language.switchToArabic')}
        lang="ar"
      >
        AR
      </button>
    </div>
  );
};

export default LanguageSwitch;
