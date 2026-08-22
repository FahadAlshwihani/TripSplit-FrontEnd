import React from 'react';
import { useTranslation } from 'react-i18next';

const CapabilityCard = ({ Icon, tagKey, titleKey, descriptionKey, soon }) => {
  const { t } = useTranslation();
  return (
    <div className={`capability-card${soon ? ' capability-card--soon' : ''}`}>
      <span className="capability-card__tag text-label">{t(tagKey)}</span>
      <Icon className="capability-card__icon" />
      {soon && <span className="capability-card__soon text-label">{t('features.section2.cards.bank.soon')}</span>}
      <h3 className="capability-card__title text-headline">{t(titleKey)}</h3>
      <p className="capability-card__description text-copy">{t(descriptionKey)}</p>
    </div>
  );
};

export default CapabilityCard;
