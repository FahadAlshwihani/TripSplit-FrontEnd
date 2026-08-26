import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import { getSettlementTimeline } from '../api/settlementsApi';

/*
  Full chronological history for one settlement -- who reported/recorded
  it, who reviewed it and how, in order. Follows the same portal/overlay/
  Escape+focus-restore pattern as ExpenseDetailsDrawer (the one existing
  drawer in this app), rather than inventing a new one.
*/
const timelineCopyKey = (event) => {
  if (event.event_type === 'settlement_created') {
    const origin = event.summary?.origin || 'legacy';
    return `settlementTimeline.created.${origin}`;
  }
  return `settlementTimeline.${event.event_type.replace('settlement_', '')}`;
};

const SettlementTimelineDrawer = ({ tripId, settlement, currency, onClose }) => {
  const { t } = useTranslation();
  const drawerRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: null, events: [] });

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus();
    };
  }, [onClose]);

  useEffect(() => { drawerRef.current?.focus(); }, []);

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
          <h2 id="settle-timeline-title" className="exp-drawer__title text-headline-sm">{t('settlements.timelineTitle')}</h2>
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
                    <span className="settle-timeline__date">{new Date(event.created_at).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default SettlementTimelineDrawer;
