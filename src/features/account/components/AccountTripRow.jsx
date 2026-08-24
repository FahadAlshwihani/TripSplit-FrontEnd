import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { archiveTrip, closeTrip, leaveTrip, restoreTrip } from '../../trips/api/tripsApi';
import LeaveTripDialog from './LeaveTripDialog';

const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  const format = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${format(start)} – ${format(end)}`;
  return format(start || end);
};

/*
  `capabilities` (from the account trip-history API) is treated as
  authoritative -- this component renders buttons from it rather than
  re-deriving lifecycle/ownership rules client-side. REJOIN never calls
  any reactivation endpoint directly: it hands off to the canonical Join
  Trip capability state machine (prefilled with this trip's own code),
  which independently re-checks ban/policy/password/approval every time.
*/
const AccountTripRow = ({ trip, onChanged }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [busyAction, setBusyAction] = useState(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const stateBadge = !trip.membership_active
    ? { key: 'left', label: t('account.trips.state.left') }
    : trip.lifecycle_status === 'closed'
      ? { key: 'closed', label: t('account.trips.state.closed') }
      : trip.archived_at
        ? { key: 'archived', label: t('account.trips.state.archived') }
        : { key: 'active', label: t('account.trips.state.active') };

  const run = async (action, fn) => {
    setBusyAction(action);
    setErrorKey(null);
    try {
      await fn();
      onChanged?.();
    } catch {
      setErrorKey('account.errors.tripActionFailed');
    } finally {
      setBusyAction(null);
    }
  };

  const confirmLeave = () => run('leave', () => leaveTrip(trip.id)).finally(() => setConfirmingLeave(false));

  return (
    <article className="acc-trip">
      <div className="acc-trip__main">
        <div className="acc-trip__badges">
          <span className={`acc-badge acc-badge--role-${trip.role}`}>{t(`account.trips.role.${trip.role}`)}</span>
          <span className={`acc-badge acc-badge--state-${stateBadge.key}`}>{stateBadge.label}</span>
        </div>
        <h3 className="acc-trip__title text-headline-sm">{trip.title}</h3>
        {formatDateRange(trip.start_date, trip.end_date) && (
          <p className="acc-trip__dates text-copy-sm">{formatDateRange(trip.start_date, trip.end_date)}</p>
        )}
        {stateBadge.key === 'closed' && <p className="acc-trip__notice text-copy-sm">{t('account.trips.closedNotice')}</p>}
        {errorKey && <p className="acc-error" role="alert">{t(errorKey)}</p>}
      </div>
      <div className="acc-trip__side">
        <span className="acc-trip__currency text-label">{t('account.trips.currency')}</span>
        <span className="acc-trip__currency-value text-copy">{trip.currency}</span>
        <div className="acc-trip__actions">
          {trip.capabilities.can_open && (
            <button type="button" className="acc-btn acc-btn--primary" onClick={() => navigate(`/trips/${trip.id}/overview`)}>
              {t('account.trips.openTrip')}
            </button>
          )}
          {trip.capabilities.can_rejoin && (
            <button type="button" className="acc-btn acc-btn--primary" onClick={() => navigate(`/trips/join?code=${trip.join_code}`)}>
              {t('account.trips.rejoin')}
            </button>
          )}
          {trip.capabilities.can_leave && (
            <button type="button" className="acc-btn acc-btn--danger" onClick={() => setConfirmingLeave(true)}>
              {t('account.trips.leaveTrip')}
            </button>
          )}
          {trip.capabilities.requires_transfer_before_leave && (
            <span className="acc-trip__transfer-hint text-copy-sm">{t('account.trips.transferBeforeLeave')}</span>
          )}
          {(trip.capabilities.can_archive || trip.capabilities.can_restore || trip.capabilities.can_close) && (
            <details className="acc-trip__more">
              <summary className="acc-link">{t('account.trips.moreActions')}</summary>
              <div className="acc-trip__more-actions">
                {trip.capabilities.can_close && (
                  <button type="button" className="acc-link" disabled={busyAction === 'close'} onClick={() => run('close', () => closeTrip(trip.id))}>{t('account.trips.closeTrip')}</button>
                )}
                {trip.capabilities.can_archive && (
                  <button type="button" className="acc-link" disabled={busyAction === 'archive'} onClick={() => run('archive', () => archiveTrip(trip.id))}>{t('account.trips.archiveTrip')}</button>
                )}
                {trip.capabilities.can_restore && (
                  <button type="button" className="acc-link" disabled={busyAction === 'restore'} onClick={() => run('restore', () => restoreTrip(trip.id))}>{t('account.trips.restoreTrip')}</button>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
      {confirmingLeave && (
        <LeaveTripDialog
          tripTitle={trip.title}
          busy={busyAction === 'leave'}
          onCancel={() => setConfirmingLeave(false)}
          onConfirm={confirmLeave}
        />
      )}
    </article>
  );
};

export default AccountTripRow;
