import React from 'react';
import { useTranslation } from 'react-i18next';
import FeatureMiniList from './FeatureMiniList';
import LedgerDemoCard from './LedgerDemoCard';

function PieChartIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 2a7 7 0 107 7h-7z" />
      <path d="M9 2a7 7 0 016.5 4.4L9 9z" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  );
}

function CurrencyExchangeIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3 6h9M9 3l3 3-3 3" />
      <path d="M15 12H6M9 15l-3-3 3-3" />
    </svg>
  );
}

const SPLIT_ITEMS = [
  { key: 'exactSplits', Icon: PieChartIcon },
  { key: 'multiCurrency', Icon: CurrencyExchangeIcon },
];

const SplitEngineSection = () => {
  const { t } = useTranslation();
  return (
    <section className="features-section">
      <div className="features-section__head">
        <span className="features-section__number text-financial">{t('features.section1.number')}</span>
        <h2 className="features-section__title text-headline-lg">{t('features.section1.title')}</h2>
      </div>
      <div className="split-engine">
        <div className="split-engine__aside">
          <p className="split-engine__description text-copy-lg">{t('features.section1.description')}</p>
          <FeatureMiniList items={SPLIT_ITEMS} />
        </div>
        <LedgerDemoCard />
      </div>
    </section>
  );
};

export default SplitEngineSection;
