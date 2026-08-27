import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { formatDate } from '../../../shared/utils/format';

const STATUS_ICON = { open: 'bi-hourglass-split', completed: 'bi-check-circle', cancelled: 'bi-slash-circle' };

/*
  One Funding Round: header (target/collected/remaining + progress),
  per-member obligation rows, any pending contributions awaiting review,
  any rejected ones offering retry, and round-level actions. Mobile-safe
  the same way Settlements/Balances rows are: a single row that wraps/
  stacks under one breakpoint, never a real <table>.
*/
const FundingRoundLedgerCard = ({
  round, contributions, currency, currentMember, canManage, collapsedByDefault, busyKey,
  onReport, onRecord, onRemind, onConfirm, onReject, onRetry, onComplete, onCancel,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(!collapsedByDefault);
  const [remindStates, setRemindStates] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const stats = round.statistics;
  const myRow = stats.members.find((row) => row.member_id === currentMember?.id);
  const iCanReport = Boolean(onReport) && round.status === 'open' && myRow && Number(myRow.remaining) > 0;
  const pending = (contributions || []).filter((row) => row.status === 'pending');
  const rejected = (contributions || []).filter((row) => row.status === 'rejected');

  const remind = async (memberId, displayName) => {
    setRemindStates((current) => ({ ...current, [memberId]: { status: 'sending' } }));
    try {
      await onRemind(memberId);
      setRemindStates((current) => ({ ...current, [memberId]: { status: 'sent', displayName } }));
    } catch (error) {
      setRemindStates((current) => ({ ...current, [memberId]: { status: error.code === 'reminder_cooldown' ? 'cooldown' : 'error' } }));
    } finally {
      window.setTimeout(() => setRemindStates((current) => ({ ...current, [memberId]: null })), 6000);
    }
  };

  const submitReject = () => {
    onReject(rejectTarget, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <article className={`fund-round-card fund-round-card--${round.status}`}>
      <header className="fund-round-card__header" onClick={() => collapsedByDefault && setExpanded((value) => !value)} role={collapsedByDefault ? 'button' : undefined} tabIndex={collapsedByDefault ? 0 : undefined}>
        <div>
          <div className="fund-round-card__badges">
            <span className="fund-round-card__seq">{t('fund.roundBadge', { number: round.sequence_number })}</span>
            <span className={`fund-round-card__status fund-round-card__status--${round.status}`}><i className={`bi ${STATUS_ICON[round.status]}`} aria-hidden="true" /> {t(`fund.status.${round.status}`)}</span>
          </div>
          <h3 className="fund-round-card__title text-headline-sm">{round.title}</h3>
          {round.reason && <p className="fund-round-card__reason text-copy-sm">{round.reason}</p>}
        </div>
        <div className="fund-round-card__progress">
          <span className="fund-round-card__progress-figures text-financial">
            <Money value={stats.collected} currency={currency} variant="tabular" /> / <Money value={stats.target} currency={currency} variant="tabular" />
          </span>
          <div className="fund-round-card__progress-bar"><div className="fund-round-card__progress-fill" style={{ width: `${Math.min(Number(stats.percentage_collected), 100)}%` }} /></div>
        </div>
        {collapsedByDefault && <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} fund-round-card__chevron`} aria-hidden="true" />}
      </header>

      {expanded && (
        <>
          <div className="fund-round-card__members">
            {stats.members.map((row) => {
              const state = remindStates[row.member_id];
              return (
                <div className="fund-round-card__member" key={row.member_id}>
                  <span className="fund-round-card__member-who">
                    <Avatar avatarKey={avatarKeyFromAvatar(row.avatar)} displayName={row.display_name} size="sm" />
                    {row.display_name}
                  </span>
                  <span className="fund-round-card__member-figures text-copy-sm">
                    {t('fund.expected')} <Money value={row.expected} currency={currency} variant="tabular" /> · {t('fund.paid')} <Money value={row.paid} currency={currency} variant="tabular" />
                    {Number(row.pending) > 0 && <> · {t('fund.pendingLabel')} <Money value={row.pending} currency={currency} variant="tabular" /></>}
                    {Number(row.overpaid) > 0 && <> · {t('fund.overpaid')} <Money value={row.overpaid} currency={currency} variant="tabular" /></>}
                  </span>
                  {canManage && round.status === 'open' && Number(row.remaining) > 0 && (
                    <span className="fund-round-card__remind">
                      <button type="button" className="bal-remind-btn" disabled={state?.status === 'sending'} aria-label={t('fund.remind')} title={t('fund.remind')} onClick={() => remind(row.member_id, row.display_name)}>
                        <i className="bi bi-bell" aria-hidden="true" />
                      </button>
                      {state && state.status !== 'sending' && (
                        <small role="status" aria-live="polite">
                          {state.status === 'sent' && t('fund.reminderSent', { name: state.displayName })}
                          {state.status === 'cooldown' && t('fund.reminderCooldown')}
                          {state.status === 'error' && t('error.action')}
                        </small>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {pending.length > 0 && (
            <div className="fund-round-card__pending">
              <span className="text-label">{t('fund.pendingReviewTitle')}</span>
              {pending.map((row) => (
                <div className="fund-pending-row" key={row.id}>
                  <span className="fund-pending-row__who">{row.display_name} — <Money value={row.amount} currency={currency} variant="tabular" /> · {formatDate(row.contribution_date)}</span>
                  {canManage && (
                    <span className="fund-pending-row__actions">
                      <button type="button" className="bal-remind-btn" disabled={busyKey === row.id} aria-label={t('fund.confirmContribution')} title={t('fund.confirmContribution')} onClick={() => onConfirm(row)}><i className="bi bi-check-lg" aria-hidden="true" /></button>
                      <button type="button" className="bal-remind-btn" disabled={busyKey === row.id} aria-label={t('fund.rejectContribution')} title={t('fund.rejectContribution')} onClick={() => setRejectTarget(row)}><i className="bi bi-x-lg" aria-hidden="true" /></button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {rejected.length > 0 && (
            <div className="fund-round-card__pending fund-round-card__pending--rejected">
              <span className="text-label">{t('fund.rejectedTitle')}</span>
              {rejected.map((row) => {
                const canRetryThis = row.member_id === currentMember?.id || canManage;
                return (
                  <div className="fund-pending-row" key={row.id}>
                    <span className="fund-pending-row__who">{row.display_name} — <Money value={row.amount} currency={currency} variant="tabular" />{row.review_note && <> · {row.review_note}</>}</span>
                    {canRetryThis && onRetry && (
                      <button type="button" className="bal-remind-btn" disabled={busyKey === row.id || row.retry_cooldown_active} aria-label={t('fund.retryContribution')} title={row.retry_cooldown_active ? t('fund.retryCooldown') : t('fund.retryContribution')} onClick={() => onRetry(row)}>
                        <i className="bi bi-arrow-repeat" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {round.status === 'open' && (
            <div className="fund-round-card__actions">
              {iCanReport && <button type="button" className="dash-btn dash-btn--secondary" onClick={onReport}>{t('fund.iPaid')}</button>}
              {canManage && onRecord && <button type="button" className="dash-btn dash-btn--secondary" onClick={onRecord}>{t('fund.recordContribution')}</button>}
              {canManage && (
                <>
                  <button type="button" className="dash-btn dash-btn--primary" disabled={busyKey === round.id} onClick={onComplete}>{t('fund.completeRound')}</button>
                  <button type="button" className="dash-btn dash-btn--secondary" disabled={busyKey === round.id || Number(stats.collected) > 0} onClick={onCancel}>{t('fund.cancelRound')}</button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {rejectTarget && (
        <div className="fund-reject-inline">
          <label className="field-label" htmlFor="fund-reject-reason">{t('fund.rejectReasonLabel')}</label>
          <input id="fund-reject-reason" className="field-control" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
          <div className="fund-reject-inline__actions">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setRejectTarget(null)}>{t('common.cancel')}</button>
            <button type="button" className="dash-btn dash-btn--danger" onClick={submitReject}>{t('fund.rejectContribution')}</button>
          </div>
        </div>
      )}
    </article>
  );
};

export default FundingRoundLedgerCard;
