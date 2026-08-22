import React from 'react';
import { useTranslation } from 'react-i18next';
import CapabilityCard from './CapabilityCard';

function RouteIcon(props) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="8" cy="10" r="3" />
      <circle cx="32" cy="30" r="3" />
      <path d="M11 10h9a6 6 0 016 6v0a6 6 0 006 6" strokeDasharray="3 4" />
      <path d="M29 30h-9a6 6 0 01-6-6v0" strokeDasharray="3 4" />
    </svg>
  );
}

function BankIcon(props) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 4l16 8H4z" />
      <path d="M6 14v16M14 14v16M20 14v16M26 14v16M34 14v16" />
      <path d="M3 34h34" />
    </svg>
  );
}

const SettlementArchitectureSection = () => {
  const { t } = useTranslation();
  return (
    <section className="features-section">
      <div className="features-section__head">
        <span className="features-section__number text-financial">{t('features.section2.number')}</span>
        <h2 className="features-section__title text-headline-lg">{t('features.section2.title')}</h2>
      </div>
      <div className="settlement-grid">
        <CapabilityCard
          Icon={RouteIcon}
          tagKey="features.section2.cards.debt.tag"
          titleKey="features.section2.cards.debt.title"
          descriptionKey="features.section2.cards.debt.description"
        />
        <CapabilityCard
          Icon={BankIcon}
          tagKey="features.section2.cards.bank.tag"
          titleKey="features.section2.cards.bank.title"
          descriptionKey="features.section2.cards.bank.description"
          soon
        />
      </div>
    </section>
  );
};

export default SettlementArchitectureSection;
