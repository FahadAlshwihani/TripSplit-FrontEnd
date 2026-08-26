import React from 'react';
import { useTranslation } from 'react-i18next';
import Money from '../../../shared/components/Money';

/*
  "My Net Balance" -- positive means the group owes the current member
  more than they owe the group; negative is the reverse; zero means
  fully settled. All three states get their own natural-language
  supporting line (never just a bare number), matching the brief's
  explicit copy.
*/
const NetBalanceCard = ({ balance, currency }) => {
  const { t } = useTranslation();
  const value = Number(balance);
  const state = value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';

  return (
    <div className={`bal-net-card bal-net-card--${state}`}>
      <span className="bal-net-card__label">{t('balances.myNetBalance')}</span>
      <Money value={balance} currency={currency} className="bal-net-card__value" currencyClassName="bal-net-card__value-currency" />
      <p className="bal-net-card__hint">
        <i className={`bi ${state === 'positive' ? 'bi-graph-up-arrow' : state === 'negative' ? 'bi-graph-down-arrow' : 'bi-check-circle'}`} aria-hidden="true" />
        {t(`balances.netBalanceHint.${state}`)}
      </p>
    </div>
  );
};

export default NetBalanceCard;
