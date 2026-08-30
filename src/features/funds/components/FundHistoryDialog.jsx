import React from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Money from '../../../shared/components/Money';
import { formatDateTime } from '../../../shared/utils/format';
import useModalDialog from '../../../shared/hooks/useModalDialog';

// Every trip-activity event_type that belongs to the Fund (audited
// directly against apps.trips.models.TripActivity.EventType and every
// apps.funds.services/apps.funds.reminders record_activity() call site).
export const FUND_EVENT_TYPES = new Set([
  'fund_created', 'fund_holder_changed', 'funding_round_created', 'funding_round_completed',
  'funding_round_cancelled', 'fund_contribution_recorded', 'fund_contribution_reported',
  'fund_contribution_confirmed', 'fund_contribution_rejected', 'fund_contribution_retry_requested',
  'fund_contribution_updated', 'fund_contribution_voided', 'fund_refund_recorded',
  'fund_reimbursement_recorded', 'fund_closed', 'fund_contribution_reminder_sent',
]);

// Same target-member field, different key per event (see the metadata
// dicts passed to record_activity() in apps.funds.services/reminders.py).
const rowMember = (summary) => summary.member || summary.holder || summary.to_name || null;
const rowContext = (summary) => summary.title || summary.round_title || summary.name || null;

/*
  Reuses Fund's own already-styled .fund-history-list/.fund-history-row
  primitives (proven in FundRefundHistory/ReimbursementSection) instead
  of the generic cross-feature ActivityPanel -- ActivityPanel's classes
  (.card-pc/.activity-row) live in the legacy CardStyles.css/
  legacyShell.css, which nothing on the Fund route imports; reusing it
  here would silently reproduce the exact "renders unstyled" bug class
  this page was already rebuilt to eliminate, and importing that legacy
  stylesheet risks its bare-tag rules leaking onto the rest of the page.
*/
const FundHistoryDialog = ({ events, hasMore, loadingMore, onLoadMore, onClose }) => {
  const { t, i18n } = useTranslation();
  const dialogRef = useModalDialog(onClose);

  return (
    <ModalPortal>
      <div className="fund-dialog-overlay" role="presentation" onClick={onClose}>
        <div ref={dialogRef} tabIndex={-1} className="fund-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-history-title" onClick={(event) => event.stopPropagation()}>
          <div className="fund-dialog__head">
            <h2 id="fund-history-title" className="fund-dialog__title text-headline">{t('fund.historyTitle')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
          </div>
          <div className="fund-dialog__body">
            {events.length === 0 ? (
              <p className="text-copy-sm fund-empty-note">{t('fund.noHistory')}</p>
            ) : (
              <div className="fund-history-list">
                {events.map((event) => {
                  const summary = event.summary || {};
                  const member = rowMember(summary);
                  const context = rowContext(summary);
                  return (
                    <div className="fund-history-row" key={event.id}>
                      <div className="fund-history-row__main">
                        <span className="fund-history-row__title text-copy">
                          <strong>{event.actor?.display_name || t('activity.system')}</strong> {t(`activity.${event.event_type}`)}
                        </span>
                        <span className="fund-history-row__meta text-copy-sm">
                          {[member, context].filter(Boolean).join(' · ')}{(member || context) && ' · '}
                          <bdi dir="ltr">{formatDateTime(event.created_at, i18n.language)}</bdi>
                        </span>
                      </div>
                      {summary.amount !== undefined && (
                        <Money value={summary.amount} currency={summary.currency} variant="tabular" className="fund-history-row__amount" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {hasMore && (
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? t('common.loading') : t('common.loadMore')}
              </button>
            )}
          </div>
          <div className="fund-dialog__footer">
            <div className="fund-dialog__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default FundHistoryDialog;
