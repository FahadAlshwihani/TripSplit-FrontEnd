import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import { getSettlementTimeline } from '../api/settlementsApi';
import { formatDateTime } from '../../../shared/utils/format';
import useModalDialog from '../../../shared/hooks/useModalDialog';
// This drawer's own markup uses expenses.css's `.exp-drawer*`/
// `.exp-modal__close` (fixed overlay/backdrop/z-index) -- imported
// explicitly here so the drawer renders correctly regardless of which
// page mounts it (Settlements or Balances) or what loaded before it.
import '../../expenses/styles/expenses.css';

/*
  Full chronological history for one settlement -- who reported/recorded
  it, who reviewed it and how, in order. Follows the same portal/overlay/
  Escape+focus-restore pattern as ExpenseDetailsDrawer (the one existing
  drawer in this app), rather than inventing a new one.

  Action props (canReview/canCancel/canRetry + onConfirm/onNotReceived/
  onCheckLater/onCancel/onRetry) are all optional -- BalancesPage's own
  usage never passes them (it already has its own PendingSettlementCard
  for inline action, so a second copy of the same buttons in its drawer
  would be redundant) and gets the exact same read-only drawer as
  before. SettlementsPage's ledger, where this drawer is now the ONLY
  place a pending/rejected settlement can be acted on (the compact
  timeline card itself is presentation-only), passes them so the
  recipient/reporter/manager recovery actions stay fully reachable.
*/
const timelineCopyKey = (event) => {
  if (event.event_type === 'settlement_created') {
    const origin = event.summary?.origin || 'legacy';
    return `settlementTimeline.created.${origin}`;
  }
  return `settlementTimeline.${event.event_type.replace('settlement_', '')}`;
};

const SettlementTimelineDrawer = ({ tripId, settlement, currency, onClose, canReview, canCancel, canRetry, onConfirm, onNotReceived, onCheckLater, onCancel, onRetry, busy }) => {
  const { t, i18n } = useTranslation();
  const drawerRef = useModalDialog(onClose);
  const [state, setState] = useState({ loading: true, error: null, events: [] });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    getSettlementTimeline(tripId, settlement.id, { signal: controller.signal })
      .then((events) => { if (!cancelled) setState({ loading: false, error: null, events }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, error, events: [] }); });
    return () => { cancelled = true; controller.abort(); };
  }, [tripId, settlement.id]);

  return (
    <ModalPortal>
      <div className="exp-drawer-overlay" role="presentation" onClick={onClose} />
      <div ref={drawerRef} tabIndex={-1} className="exp-drawer" role="dialog" aria-modal="true" aria-labelledby="settle-timeline-title">
        <div className="exp-drawer__head">
          <h2 id="settle-timeline-title" className="exp-drawer__title text-headline">{t('settlements.timelineTitle')}</h2>
          <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}>
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        <div className="exp-drawer__body">
          <div className="settle-timeline__summary">
            <span>{settlement.from_name} → {settlement.to_name}</span>
            <Money value={settlement.amount} currency={currency} />
          </div>

          {state.loading && <p className="text-copy-sm">…</p>}
          {state.error && <p className="field-error" role="alert">{state.error.message || t('error.action')}</p>}
          {!state.loading && !state.error && state.events.length === 0 && <p className="text-copy-sm">{t('settlements.timelineEmpty')}</p>}

          {!state.loading && state.events.length > 0 && (
            <ol className="settle-timeline__list">
              {state.events.map((event) => (
                <li key={event.id} className="settle-timeline__item">
                  <span className="settle-timeline__dot" aria-hidden="true" />
                  <div className="settle-timeline__content">
                    <p className="settle-timeline__text">
                      {t(timelineCopyKey(event), { name: event.actor?.display_name || t('activity.system'), amount: event.summary?.amount, currency: event.summary?.currency || currency })}
                    </p>
                    <span className="settle-timeline__date"><bdi dir="ltr">{formatDateTime(event.created_at, i18n.language)}</bdi></span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        {settlement.status === 'pending' && (canReview || canCancel) && (
          <div className="exp-drawer__footer">
            {canReview && (
              <div className="exp-drawer__footer-row">
                <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={() => onCheckLater(settlement)}>{t('settlements.checkLaterAction')}</button>
                <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={() => onNotReceived(settlement)}>{t('settlements.notReceivedAction')}</button>
                <button type="button" className="dash-btn dash-btn--primary" disabled={busy} onClick={() => onConfirm(settlement)}>{t('settlements.yesReceived')}</button>
              </div>
            )}
            {canCancel && !canReview && (
              <div className="exp-drawer__footer-row">
                <button type="button" className="dash-btn dash-btn--secondary" disabled={busy} onClick={() => onCancel(settlement)}>{t('settlements.withdrawReport')}</button>
              </div>
            )}
          </div>
        )}
        {settlement.status === 'rejected' && canRetry && (
          <div className="exp-drawer__footer">
            <div className="exp-drawer__footer-row">
              <button type="button" className="dash-btn dash-btn--primary" disabled={busy || settlement.retry_cooldown_active} title={settlement.retry_cooldown_active ? t('settlements.retryCooldown') : undefined} onClick={() => onRetry(settlement)}>{t('settlements.retryAction')}</button>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};

export default SettlementTimelineDrawer;
