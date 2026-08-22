import React from 'react';
import { useTranslation } from 'react-i18next';

const FeaturesHeader = () => {
  const { t } = useTranslation();
  return (
    <header className="features-header">
      <p className="features-header__eyebrow text-label">{t('features.eyebrow')}</p>
      <h1 className="features-header__title text-display">{t('features.title')}</h1>
      <p className="features-header__description text-copy-lg">{t('features.description')}</p>
    </header>
  );
};

export default FeaturesHeader;
