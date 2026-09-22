import React from 'react';
import { useTranslation } from 'react-i18next';

const FeaturesHeader = ({ headingLevel: Heading = 'h1' }) => {
  const { t } = useTranslation();
  return (
    <header className="features-header">
      <p className="features-header__eyebrow text-label">{t('features.eyebrow')}</p>
      <Heading className="features-header__title text-display">{t('features.title')}</Heading>
      <p className="features-header__description text-copy-lg">{t('features.description')}</p>
    </header>
  );
};

export default FeaturesHeader;
