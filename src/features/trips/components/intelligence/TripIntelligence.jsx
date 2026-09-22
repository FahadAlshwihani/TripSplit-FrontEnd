import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRouteResource from '../../../../shared/hooks/useRouteResource';
import { getTripIntelligence } from '../../api/tripsApi';
import { categoryLabel } from '../../../../shared/utils/categoryPresentation';
import './intelligence.css';

const pageCodes = {
  overview: ['financial_risk', 'fund_shortfall', 'category_risk', 'closeout_blockers', 'next_payer', 'fund_round_gap', 'forecast', 'fund_runway'],
  expenses: ['financial_risk', 'category_risk', 'next_payer', 'forecast'],
  fund: ['fund_shortfall', 'fund_round_gap', 'fund_runway'],
  balances: ['next_payer'],
  settlements: ['closeout_blockers', 'settle_now', 'settle_wait'],
};

const money = (value, currency) => value == null ? null : <bdi dir="ltr" className="trip-insight__money">{value} {currency}</bdi>;

function SmartInsight({ item, currency, tripRef, tier }) {
  const { t } = useTranslation();
  const [explained, setExplained] = useState(false);
  const explanationId = useId();
  const key = `intelligence.${item.code}`;
  const value = item.code === 'next_payer' ? item.payer?.name
    : item.code === 'fund_round_gap' ? money(item.amount, currency)
      : item.code === 'forecast' ? money(item.projected_total, currency)
        : item.code === 'settle_now' ? money(item.outstanding, currency)
          : item.code === 'fund_runway' ? <bdi dir="ltr" className="trip-insight__money">{item.runway_days} {t('intelligence.days')}</bdi>
            : item.code === 'category_risk' ? categoryLabel(t, item.category?.code, item.category?.name) : null;
  return (
    <article className={`trip-insight trip-insight--${tier}`}>
      <div className="trip-insight__copy">
        <h3><span className="trip-insight__sparkle" aria-hidden="true">✨</span>{t(`${key}.title`)}</h3>
        <p>{t(`${key}.body`)} {value}</p>
      </div>
      <div className="trip-insight__actions">
        <button className="trip-insight__disclosure" type="button" aria-expanded={explained} aria-controls={explanationId} onClick={() => setExplained((shown) => !shown)}>{t('intelligence.why')}</button>
        <Link to={`/trips/${tripRef}/${item.action}`}>{t(`intelligence.action.${item.action}`)} <span aria-hidden="true">→</span></Link>
      </div>
      {explained && <p id={explanationId} className="trip-insight__explanation">{t(`${key}.why`)} {item.code === 'next_payer' ? money(item.payer?.balance_before, currency) : null}</p>}
    </article>
  );
}

function CloseoutProgress({ closeout, currency }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const outstanding = closeout.blockers.length;
  return <article className="trip-insight trip-insight--closeout">
    <div className="trip-insight__copy">
      <h3><span className="trip-insight__sparkle" aria-hidden="true">✨</span>{t('intelligence.closeoutTitle')}</h3>
      <p>{outstanding ? t('intelligence.closeoutBlockerCount', { count: outstanding }) : t('intelligence.closeoutReady')}</p>
    </div>
    {(outstanding > 0 || closeout.warnings?.length > 0) && <>
      <button className="trip-insight__disclosure" type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((shown) => !shown)}>
        {t(expanded ? 'intelligence.hideDetails' : 'intelligence.showDetails')}
      </button>
      {expanded && <div id={id} className="trip-insight__details">
        {outstanding > 0 && <ul>{closeout.blockers.map((blocker) => <li key={blocker.code}>
          {t(`intelligence.blocker.${blocker.code}`)} {blocker.amount != null ? money(blocker.amount, currency) : blocker.count}
        </li>)}</ul>}
        {closeout.warnings?.includes('trip_not_ended') && <p>{t('intelligence.tripNotEnded')}</p>}
      </div>}
    </>}
  </article>;
}

export default function TripIntelligence({ tripId, tripRef, placement, revision = 0 }) {
  const { t } = useTranslation();
  const resource = useRouteResource((signal) => getTripIntelligence(tripId, { signal }), [tripId, revision], true);
  const data = resource.data;
  // Keep the server's ranking; only limit the presentation per page.
  const relevant = (data?.suggestions || []).filter((item) => pageCodes[placement]?.includes(item.code))
    .slice(0, placement === 'overview' ? 3 : placement === 'settlements' ? 1 : 2);
  const showRecap = placement === 'overview' && data?.recap;
  const showCloseout = placement === 'settlements' && data?.closeout && (data.spending?.expense_count > 0 || data.closeout.blockers.length > 0);
  const showHealth = placement === 'overview' && !relevant.length && data?.health?.status === 'HEALTHY';
  if (!relevant.length && !showRecap && !showCloseout && !showHealth) return null;
  return (
    <section className={`trip-intelligence trip-intelligence--${placement}`} aria-label={t('intelligence.heading')}>
      {placement === 'overview' && <h2 className="trip-intelligence__heading"><span aria-hidden="true">✨</span> {t('intelligence.heading')}</h2>}
      {showHealth && <p className="trip-intelligence__health"><span aria-hidden="true">✨</span> {t('intelligence.health.HEALTHY')}</p>}
      {relevant.length > 0 && <div className="trip-intelligence__list">
        {relevant.map((item, index) => <SmartInsight key={item.code} item={item} currency={data.currency} tripRef={tripRef}
          tier={(placement === 'overview' && index === 0) || placement === 'settlements' ? 'primary' : 'secondary'} />)}
      </div>}
      {showCloseout && <CloseoutProgress closeout={data.closeout} currency={data.currency} />}
      {showRecap && <div className="trip-intelligence__recap">
        <article className="trip-insight trip-insight--recap">
          <h3>{t('intelligence.recap')}</h3><p>{data.recap.trip_title}</p>
          <dl><div><dt>{t('intelligence.expenses')}</dt><dd>{data.recap.expense_count}</dd></div>
            <div><dt>{t('intelligence.travelers')}</dt><dd>{data.recap.member_count}</dd></div>
            {data.recap.duration_days && <div><dt>{t('intelligence.duration')}</dt><dd>{data.recap.duration_days}</dd></div>}
            <div><dt>{t('intelligence.totalSpent')}</dt><dd>{money(data.recap.total_spent, data.currency)}</dd></div>
            {data.recap.average_per_member && <div><dt>{t('intelligence.average')}</dt><dd>{money(data.recap.average_per_member, data.currency)}</dd></div>}
          </dl>
        </article>
      </div>}
    </section>
  );
}
