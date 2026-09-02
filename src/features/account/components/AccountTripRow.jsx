import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { archiveTrip, closeTrip, leaveTrip, restoreTrip } from '../../trips/api/tripsApi';
import { tripJoinPath } from '../../../shared/utils/shareLinks';
import LeaveTripDialog from './LeaveTripDialog';
import TripMoreActionsMenu from './TripMoreActionsMenu';

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

  const hasMoreActions = trip.capabilities.can_leave || trip.capabilities.can_archive || trip.capabilities.can_restore
    || trip.capabilities.can_close || trip.capabilities.requires_transfer_before_leave;

  return (
    <article className="acc-trip">
      {/* Fixed three-row anchor (badges / title / date) -- top-anchored,
          never vertically centered, so badges/title/date sit at the same
          position on every card regardless of how tall the aside column
          next to it happens to be (a longer title, a missing date, or an
          aside with/without a secondary action must not shift them). */}
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
            <button type="button" className="acc-btn acc-btn--primary acc-trip__primary-action" onClick={() => navigate(`/trips/${trip.short_code}/overview`)}>
              {t('account.trips.openTrip')}
            </button>
          )}
          {trip.capabilities.can_rejoin && (
            <button type="button" className="acc-btn acc-btn--primary acc-trip__primary-action" onClick={() => navigate(tripJoinPath(trip.join_code))}>
              {t('account.trips.rejoin')}
            </button>
          )}
          {/* Information stays text; the actual action is always a real
              button -- never naked instructional text pretending to be
              interactive. The Account page has no member list to pick a
              transfer target from, so this hands off to the existing
              Members page (where transferOwnership already lives) rather
              than inventing a transfer flow here. */}
          {trip.capabilities.requires_transfer_before_leave && (
            <span className="acc-trip__transfer-hint text-copy-sm">{t('account.trips.transferBeforeLeave')}</span>
          )}
          {/* A destructive Leave action doesn't get equal visual weight to
              Open Trip -- it lives behind the same compact "more actions"
              popover owner-only lifecycle actions already use, not as a
              second full-width button stacked under the primary one.
              Portaled to <body> (see TripMoreActionsMenu) so it floats
              above every surrounding trip row instead of being clipped by
              this row's own overflow:hidden (needed to keep the main/aside
              background split contained to one shared rounded corner) and
              is unaffected by this row's own hover/press transform. Rows
              inside render as real menu-action controls (icon + label,
              full hit target, hard-shadow press on hover) instead of
              naked underlined text links. Only Leave is styled
              destructive -- Close/Archive/Restore are all reversible
              (a closed trip can be reopened, an archived one restored),
              so they don't get red treatment just for being secondary. */}
          {hasMoreActions && (
            <TripMoreActionsMenu label={t('account.trips.moreActions')}>
              {({ close }) => (
                <>
                  {trip.capabilities.requires_transfer_before_leave && (
                    <button type="button" className="acc-trip__more-action" onClick={() => { close(); navigate(`/trips/${trip.short_code}/members`); }}>
                      <i className="bi bi-people acc-trip__more-action-icon" aria-hidden="true" />
                      {t('account.trips.manageOwnership')}
                    </button>
                  )}
                  {trip.capabilities.can_close && (
                    <button type="button" className="acc-trip__more-action" disabled={busyAction === 'close'} onClick={() => { close(); run('close', () => closeTrip(trip.id)); }}>
                      <i className="bi bi-lock acc-trip__more-action-icon" aria-hidden="true" />
                      {t('account.trips.closeTrip')}
                    </button>
                  )}
                  {trip.capabilities.can_archive && (
                    <button type="button" className="acc-trip__more-action" disabled={busyAction === 'archive'} onClick={() => { close(); run('archive', () => archiveTrip(trip.id)); }}>
                      <i className="bi bi-archive acc-trip__more-action-icon" aria-hidden="true" />
                      {t('account.trips.archiveTrip')}
                    </button>
                  )}
                  {trip.capabilities.can_restore && (
                    <button type="button" className="acc-trip__more-action" disabled={busyAction === 'restore'} onClick={() => { close(); run('restore', () => restoreTrip(trip.id)); }}>
                      <i className="bi bi-arrow-counterclockwise acc-trip__more-action-icon" aria-hidden="true" />
                      {t('account.trips.restoreTrip')}
                    </button>
                  )}
                  {trip.capabilities.can_leave && (
                    <button type="button" className="acc-trip__more-action acc-trip__more-action--danger" onClick={() => { close(); setConfirmingLeave(true); }}>
                      <i className="bi bi-box-arrow-right acc-trip__more-action-icon" aria-hidden="true" />
                      {t('account.trips.leaveTrip')}
                    </button>
                  )}
                </>
              )}
            </TripMoreActionsMenu>
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
