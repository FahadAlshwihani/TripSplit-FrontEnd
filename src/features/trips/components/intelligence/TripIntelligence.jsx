import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRouteResource from '../../../../shared/hooks/useRouteResource';
import { getTripIntelligence } from '../../api/tripsApi';
import { categoryLabel } from '../../../../shared/utils/categoryPresentation';
import useDismissedInsights from './useDismissedInsights';
import './intelligence.css';

const pageCodes = {
  overview: ['financial_risk', 'fund_shortfall', 'category_risk', 'closeout_blockers', 'next_payer', 'fund_round_gap', 'forecast', 'fund_runway'],
  expenses: ['financial_risk', 'category_risk', 'next_payer', 'forecast'],
  fund: ['fund_shortfall', 'fund_round_gap', 'fund_runway'],
  balances: ['next_payer'],
  settlements: ['closeout_blockers', 'settle_now', 'settle_wait'],
};

const money = (value, currency) => value == null ? null : <bdi dir="ltr" className="trip-insight__money">{value} {currency}</bdi>;

function DismissButton({ onClick }) {
  const { t } = useTranslation();
  return <button type="button" className="trip-insight__dismiss pressable-sm" onClick={onClick} aria-label={t('intelligence.dismiss')}>×</button>;
}

function SmartInsight({ item, currency, tripRef, tier, onDismiss }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      <div className="trip-insight__head">
        <h3><span className="trip-insight__sparkle" aria-hidden="true">✨</span>{t(`${key}.title`)}</h3>
        <DismissButton onClick={onDismiss} />
      </div>
      <p>{t(`${key}.body`)} {value}</p>
      <div className="trip-insight__actions">
        <button className="trip-insight__control trip-insight__control--primary pressable-sm" type="button" onClick={() => navigate(`/trips/${tripRef}/${item.action}`)}>{t(`intelligence.action.${item.action}`)}</button>
        <button className="trip-insight__control trip-insight__control--secondary pressable-sm" type="button" aria-expanded={explained} aria-controls={explanationId} onClick={() => setExplained((shown) => !shown)}>{t('intelligence.why')}</button>
      </div>
      {explained && <p id={explanationId} className="trip-insight__explanation">{t(`${key}.why`)} {item.code === 'next_payer' ? money(item.payer?.balance_before, currency) : null}</p>}
    </article>
  );
}

function CloseoutProgress({ closeout, currency, onDismiss }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const outstanding = closeout.blockers.length;
  return <article className="trip-insight trip-insight--closeout">
    <div className="trip-insight__head">
      <h3><span className="trip-insight__sparkle" aria-hidden="true">✨</span>{t('intelligence.closeoutTitle')}</h3>
      <DismissButton onClick={onDismiss} />
    </div>
    <p>{outstanding ? t('intelligence.closeoutBlockerCount', { count: outstanding }) : t('intelligence.closeoutReady')}</p>
    {(outstanding > 0 || closeout.warnings?.length > 0) && <>
      <button className="trip-insight__control trip-insight__control--secondary pressable-sm" type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((shown) => !shown)}>
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
  const { isDismissed, dismiss } = useDismissedInsights(tripId);
  const resource = useRouteResource((signal) => getTripIntelligence(tripId, { signal }), [tripId, revision], true);
  const data = resource.data;
  // Keep the server's ranking; only limit the presentation per page.
  const relevant = (data?.suggestions || []).filter((item) => pageCodes[placement]?.includes(item.code) && !isDismissed(item, data))
    .slice(0, placement === 'overview' ? 3 : placement === 'settlements' ? 1 : 2);
  const showRecap = placement === 'overview' && data?.recap;
  const closeoutItem = { code: 'closeout_checklist' };
  const healthItem = { code: 'healthy' };
  const showCloseout = placement === 'settlements' && data?.closeout && (data.spending?.expense_count > 0 || data.closeout.blockers.length > 0) && !isDismissed(closeoutItem, data);
  const showHealth = placement === 'overview' && !(data?.suggestions || []).length && data?.health?.status === 'HEALTHY' && !isDismissed(healthItem, data);
  if (!relevant.length && !showRecap && !showCloseout && !showHealth) return null;
  return (
    <section className={`trip-intelligence trip-intelligence--${placement}`} aria-label={t('intelligence.heading')}>
      {showHealth && <div className="trip-intelligence__health"><span aria-hidden="true">✨</span> {t('intelligence.health.HEALTHY')}<DismissButton onClick={() => dismiss(healthItem, data)} /></div>}
      {relevant.length > 0 && <div className="trip-intelligence__list">
        {relevant.map((item, index) => <SmartInsight key={item.code} item={item} currency={data.currency} tripRef={tripRef}
          tier={(placement === 'overview' && index === 0) || placement === 'settlements' ? 'primary' : 'secondary'} onDismiss={() => dismiss(item, data)} />)}
      </div>}
      {showCloseout && <CloseoutProgress closeout={data.closeout} currency={data.currency} onDismiss={() => dismiss(closeoutItem, data)} />}
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
