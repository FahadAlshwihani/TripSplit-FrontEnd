import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../../../shared/utils/format';

/*
  Stitch source (PENDING INVITATIONS section):
    <div class="flex items-center justify-between mb-md">
      <div class="flex items-center gap-sm">
        <span class="material-symbols-outlined text-secondary">mail</span>
        <h2 class="font-headline-sm text-headline-sm text-on-background">PENDING INVITATIONS</h2>
      </div>
      <button class="text-primary font-label-tabular ... flex items-center gap-xs">
        <span class="material-symbols-outlined text-sm">add</span> Invite
      </button>
    </div>
    <div class="border border-on-background bg-surface rounded-DEFAULT overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-md border-b ... gap-md">
        <div><email/><p class="text-body-sm ...">Sent by You • 2 days ago</p></div>
        <div class="flex items-center gap-sm shrink-0 sm:ml-auto">
          <Revoke/>
          <button class="... text-primary ... flex items-center gap-xs">
            <span class="material-symbols-outlined text-sm">send</span> Resend
          </button>
        </div>
      </div>
      ...
    </div>
*/
export default function InvitationsSection({ invitations, onOpenInvite, onResend, onRevoke, canInvite, canResend, canRevoke }) {
  const { t, i18n } = useTranslation();
  const live = invitations.filter((row) => !row.accepted_at && !row.revoked_at);
  return (
    <>
      <div className="gov-section-head gov-section-head--split">
        <span className="gov-section-head__group">
          <span className="material-symbols-outlined gov-section-head__icon gov-section-head__icon--neutral" aria-hidden="true">mail</span>
          <h2 className="gov-section-head__title">{t('governance.invitations')}</h2>
        </span>
        {canInvite && (
          <button type="button" className="gov-invite-action" onClick={onOpenInvite}>
            <span className="material-symbols-outlined gov-icon-sm" aria-hidden="true">add</span> {t('governance.addMember')}
          </button>
        )}
      </div>
      <div className="gov-section-body">
        {live.length > 0 ? (
          <ul className="gov-list">
            {live.map((row) => (
              <li className="gov-row" key={row.id}>
                <div className="gov-row__text">
                  <span className="gov-row__name">
                    {row.email ? <bdi dir="ltr">{row.email}</bdi> : t('governance.guestInvite')}
                  </span>
                  <p className="gov-row__meta">{t('governance.sentByOn', { name: row.invited_by?.display_name || t('activity.unknown'), date: formatRelativeTime(row.created_at, i18n.language) })}</p>
                </div>
                <div className="gov-row__actions">
                  {canRevoke && <button type="button" className="gov-btn" onClick={() => onRevoke(row)}>{t('governance.revoke')}</button>}
                  {canResend && row.email && (
                    <button type="button" className="gov-btn gov-btn--accent" onClick={() => onResend(row)}>
                      <span className="material-symbols-outlined gov-icon-sm" aria-hidden="true">send</span> {t('governance.resend')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gov-list gov-list--empty">
            <p className="gov-empty">{t('governance.noInvitations')}</p>
          </div>
        )}
      </div>
    </>
  );
}
