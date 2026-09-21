import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRouteResource from '../../../../shared/hooks/useRouteResource';
import { getTripIntelligence } from '../../api/tripsApi';
import './intelligence.css';

const pageCodes = {
  overview: ['financial_risk', 'fund_shortfall', 'category_risk', 'closeout_blockers', 'next_payer', 'fund_round_gap', 'forecast', 'fund_runway'],
  expenses: ['financial_risk', 'category_risk', 'next_payer', 'forecast'],
  fund: ['fund_shortfall', 'fund_round_gap', 'fund_runway'],
  balances: ['next_payer'],
  settlements: ['closeout_blockers', 'settle_now', 'settle_wait'],
};

const money = (value, currency) => value == null ? null : <bdi dir="ltr" className="trip-insight__money">{value} {currency}</bdi>;

function SmartInsight({ item, currency, tripRef }) {
  const { t } = useTranslation();
  const [explained, setExplained] = useState(false);
  const key = `intelligence.${item.code}`;
  const value = item.code === 'next_payer' ? item.payer?.name
    : item.code === 'fund_round_gap' ? money(item.amount, currency)
      : item.code === 'forecast' ? money(item.projected_total, currency)
        : item.code === 'settle_now' ? money(item.outstanding, currency)
          : item.code === 'fund_runway' ? <bdi dir="ltr" className="trip-insight__money">{item.runway_days} {t('intelligence.days')}</bdi>
            : item.code === 'category_risk' ? item.category?.code : null;
  return (
    <article className={`trip-insight trip-insight--${item.priority <= 3 ? 'attention' : 'note'}`}>
      <div className="trip-insight__top"><span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span><span>{t('intelligence.label')}</span></div>
      <h3>{t(`${key}.title`)}</h3>
      <p>{t(`${key}.body`)} {value}</p>
      <div className="trip-insight__actions">
        <button type="button" onClick={() => setExplained((shown) => !shown)} aria-expanded={explained}>
          {t('intelligence.why')}
        </button>
        <Link to={`/trips/${tripRef}/${item.action}`}>{t(`intelligence.action.${item.action}`)}</Link>
      </div>
      {explained && <p className="trip-insight__explanation">{t(`${key}.why`)} {item.code === 'next_payer' ? money(item.payer?.balance_before, currency) : null}</p>}
    </article>
  );
}

export default function TripIntelligence({ tripId, tripRef, placement, revision = 0 }) {
  const { t } = useTranslation();
  const resource = useRouteResource((signal) => getTripIntelligence(tripId, { signal }), [tripId, revision], true);
  const data = resource.data;
  const relevant = (data?.suggestions || []).filter((item) => pageCodes[placement]?.includes(item.code)).slice(0, placement === 'overview' ? 3 : 2);
  const showRecap = placement === 'overview' && data?.recap;
  const showCloseout = placement === 'settlements' && data?.health?.status !== 'NO_DATA' && data?.closeout;
  if (!relevant.length && !showRecap && !showCloseout) return null;
  return (
    <section className="trip-intelligence" aria-label={t('intelligence.heading')}>
      <div className="trip-intelligence__heading"><span className="material-symbols-outlined" aria-hidden="true">query_stats</span><h2>{t('intelligence.heading')}</h2></div>
      {placement === 'overview' && data?.health?.status && data.health.status !== 'NO_DATA' && (
        <p className="trip-intelligence__health" role="status">{t(`intelligence.health.${data.health.status}`)}</p>
      )}
      <div className="trip-intelligence__grid">
        {relevant.map((item) => <SmartInsight key={item.code} item={item} currency={data.currency} tripRef={tripRef} />)}
        {showCloseout && <article className="trip-insight trip-insight--checklist">
          <h3>{t('intelligence.closeoutTitle')}</h3>
          <p>{t(data.closeout.ready ? 'intelligence.closeoutReady' : 'intelligence.closeoutPending')}</p>
          {!!data.closeout.blockers.length && <ul>{data.closeout.blockers.map((blocker) => <li key={blocker.code}>
            {t(`intelligence.blocker.${blocker.code}`)} {blocker.amount != null ? money(blocker.amount, data.currency) : blocker.count}
          </li>)}</ul>}
          {data.closeout.warnings?.includes('trip_not_ended') && <p className="trip-insight__explanation">{t('intelligence.tripNotEnded')}</p>}
        </article>}
        {showRecap && <article className="trip-insight trip-insight--recap">
          <h3>{t('intelligence.recap')}</h3><p>{data.recap.trip_title}</p>
          <dl><div><dt>{t('intelligence.expenses')}</dt><dd>{data.recap.expense_count}</dd></div>
            <div><dt>{t('intelligence.travelers')}</dt><dd>{data.recap.member_count}</dd></div>
            {data.recap.duration_days && <div><dt>{t('intelligence.duration')}</dt><dd>{data.recap.duration_days}</dd></div>}
            <div><dt>{t('intelligence.totalSpent')}</dt><dd>{money(data.recap.total_spent, data.currency)}</dd></div>
            {data.recap.average_per_member && <div><dt>{t('intelligence.average')}</dt><dd>{money(data.recap.average_per_member, data.currency)}</dd></div>}
          </dl>
        </article>}
      </div>
    </section>
  );
}
