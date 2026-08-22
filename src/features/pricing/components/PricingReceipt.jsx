import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { key: 'unlimitedTrips', Icon: InfinityIcon },
  { key: 'sharedExpenses', Icon: PeopleIcon },
  { key: 'tripFund', Icon: SavingsIcon },
  { key: 'exportableLedgers', Icon: ReceiptIcon },
  { key: 'multiCurrency', Icon: LanguageIcon },
];

function InfinityIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.75 5.5a2.5 2.5 0 100 5c.8 0 1.5-.4 2-1l2.5-3a2.5 2.5 0 112 4c-.8 0-1.5-.4-2-1l-2.5-3a2.5 2.5 0 00-2-1z" />
    </svg>
  );
}

function PeopleIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="5.5" cy="5.5" r="2" />
      <circle cx="11" cy="6.5" r="1.6" />
      <path d="M1.5 13.5c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M9.3 13.5c.2-1.6 1.4-2.7 3-2.7s2.9 1.1 3.2 2.7" />
    </svg>
  );
}

function SavingsIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2.5 8.6a4.4 4.4 0 014.2-4.4c.3-.6.9-1 1.6-1 .8 0 1.4.6 1.5 1.3.9.3 1.6.9 2.1 1.7h.8c.5 0 .7.6.4 1l-.7.9v1.7c0 .5-.2.9-.6 1.2l-1.1.8v1.6a.4.4 0 01-.4.4h-1a.4.4 0 01-.4-.4v-.8H6.8v.8a.4.4 0 01-.4.4h-1a.4.4 0 01-.4-.4v-1.4c-1.2-.6-2-1.9-2-3.4z" />
      <circle cx="9.8" cy="7" r=".5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ReceiptIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 1.5h8v13l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1-1.5 1v-13z" />
      <line x1="6" y1="4.5" x2="10" y2="4.5" />
      <line x1="6" y1="7" x2="10" y2="7" />
      <line x1="6" y1="9.5" x2="8.5" y2="9.5" />
    </svg>
  );
}

function LanguageIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c1.8 1.8 2.8 3.8 2.8 6S9.8 12.2 8 14c-1.8-1.8-2.8-3.8-2.8-6S6.2 3.8 8 2z" />
    </svg>
  );
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 8.3l3.3 3.3 7.2-7.2" />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

const CreditCardOffIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
    <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
    <line x1="2" y1="14" x2="14" y2="2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 8h11M9 4l4 4-4 4" />
  </svg>
);

const PricingReceipt = () => {
  const { t } = useTranslation();

  return (
    <div className="pricing-receipt">
      <div className="pricing-receipt__header">
        <p className="pricing-receipt__eyebrow text-label">{t('pricing.eyebrow')}</p>
        <h1 className="pricing-receipt__title text-display">
          <span>{t('pricing.titleLine1')}</span>
          <span>{t('pricing.titleLine2')}</span>
        </h1>
      </div>

      <div className="pricing-receipt__price">
        <span className="pricing-receipt__cutout pricing-receipt__cutout--left" aria-hidden="true" />
        <span className="pricing-receipt__cutout pricing-receipt__cutout--right" aria-hidden="true" />
        <div className="pricing-receipt__price-row">
          <span className="pricing-receipt__currency text-headline-lg">$</span>
          <span className="pricing-receipt__zero">0</span>
        </div>
        <span className="pricing-receipt__badge text-label">{t('pricing.freeBadge')}</span>
      </div>

      <div className="pricing-receipt__body">
        <ul className="pricing-receipt__list">
          {FEATURES.map(({ key, Icon }) => (
            <li className="pricing-receipt__row" key={key}>
              <span className="pricing-receipt__row-main text-financial">
                <Icon className="pricing-receipt__row-icon" />
                <span>{t(`pricing.features.${key}`)}</span>
              </span>
              <CheckIcon />
            </li>
          ))}
        </ul>

        <div className="pricing-receipt__actions">
          <Link to="/create-trip" className="pricing-receipt__cta">
            <span>{t('pricing.createFree')}</span>
            <ArrowRightIcon />
          </Link>
          <div className="pricing-receipt__assurance text-label">
            <span className="pricing-receipt__assurance-item"><CloseIcon />{t('pricing.noSubscription')}</span>
            <span className="pricing-receipt__assurance-sep" aria-hidden="true">•</span>
            <span className="pricing-receipt__assurance-item"><CloseIcon />{t('pricing.noPaidTier')}</span>
            <span className="pricing-receipt__assurance-sep" aria-hidden="true">•</span>
            <span className="pricing-receipt__assurance-item"><CreditCardOffIcon />{t('pricing.noCreditCard')}</span>
          </div>
        </div>
      </div>

      <span className="pricing-receipt__stamp" aria-hidden="true">{t('pricing.approved')}</span>
    </div>
  );
};

export default PricingReceipt;
