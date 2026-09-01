import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatRelativeTime } from '../../../shared/utils/format';

/*
  Stitch source (JOIN REQUESTS section):
    <div class="flex items-center gap-sm mb-md">
      <span class="material-symbols-outlined text-primary">person_add</span>
      <h2 class="font-headline-sm text-headline-sm text-on-background">JOIN REQUESTS</h2>
      <span class="bg-surface-variant ... rounded-full text-xs">2</span>
    </div>
    <div class="border border-on-background bg-surface rounded-DEFAULT overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-md border-b ... gap-md">
        <div class="flex items-start gap-md">
          <div class="w-10 h-10 rounded-full ...">A</div>
          <div>
            <div class="flex items-center gap-sm"><name/><badge/></div>
            <p class="... text-body-sm ...">Requested 8 minutes ago via invite link.</p>
          </div>
        </div>
        <div class="flex items-center gap-sm shrink-0 sm:ml-auto"><Reject/><Approve/></div>
      </div>
      ...
    </div>

  Every TripJoinRequest in this codebase is created through the same
  approval-required join-code path (apps.trips.governance.
  create_join_request) -- there is no other route that produces one --
  so "via invite link" is a real, honest fact about every row, not an
  invented per-row source label the backend can't actually tell apart.

  The avatar renders as a dedicated rectangular end-cap block
  (.gov-row__avatar), NOT the small circular badge Stitch's own mock
  showed -- deliberately departed from that literal port on request:
  square/small-radius (this app's own brand identity everywhere else,
  e.g. Members), sized to its own slot and stretched to the row's full
  height at >=640px (see governance.css's own comment on
  .gov-row__avatar). Trailing in DOM order (after identity/actions) so
  the existing approve/reject tab order is completely unaffected.
*/
export default function JoinRequestsSection({ requests, onReview, canReview }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <div className="gov-section-head">
        <span className="material-symbols-outlined gov-section-head__icon" aria-hidden="true">person_add</span>
        <h2 className="gov-section-head__title">{t('governance.requests')}</h2>
        {requests.length > 0 && <span className="gov-count-badge">{requests.length}</span>}
      </div>
      <div className="gov-section-body">
        {requests.length > 0 ? (
          <ul className="gov-list">
            {requests.map((row) => (
              <li className="gov-row" key={row.id}>
                <div className="gov-row__identity">
                  <div className="gov-row__text">
                    <div className="gov-row__name-line">
                      <span className="gov-row__name">{row.display_name}</span>
                      {row.identity_type === 'guest' && <span className="gov-row__guest-badge">{t('identity.guest')}</span>}
                    </div>
                    <p className="gov-row__meta">{t('governance.requestedMeta', { date: formatRelativeTime(row.requested_at, i18n.language) })}</p>
                  </div>
                </div>
                {canReview && (
                  <div className="gov-row__actions">
                    <button type="button" className="gov-btn" onClick={() => onReview(row, 'reject')}>{t('governance.reject')}</button>
                    <button type="button" className="gov-btn gov-btn--primary" onClick={() => onReview(row, 'approve')}>{t('governance.approve')}</button>
                  </div>
                )}
                <div className="gov-row__avatar">
                  <Avatar avatarKey={avatarKeyFromAvatar(row.avatar)} displayName={row.display_name} size="md" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gov-list gov-list--empty">
            <p className="gov-empty">{t('governance.noRequests')}</p>
          </div>
        )}
      </div>
    </>
  );
}
