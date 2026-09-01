import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../shared/utils/format';

/*
  Stitch source (RESTRICTED section) -- the closest section to the app's
  prior implementation, ported near-1:1:
    <section class="border-2 border-on-background bg-surface rounded-DEFAULT p-md relative overflow-hidden">
      <div class="absolute -top-4 -right-4 w-16 h-16 bg-error-container border-2 ... rotate-12 -z-0"></div>
      <div class="relative z-10">
        <div class="flex items-center gap-sm mb-md">
          <span class="material-symbols-outlined text-error">block</span>
          <h2 class="font-headline-sm text-headline-sm text-on-background">RESTRICTED</h2>
        </div>
        <div class="flex flex-col gap-sm">
          <div class="border border-on-background bg-background p-sm rounded-DEFAULT flex flex-col gap-sm">
            <div class="flex justify-between items-start">
              <div><name/><p class="text-label-caps text-error mt-0.5">Temporary ban</p></div>
            </div>
            <p class="text-body-sm ... bg-surface-container p-2 rounded-sm border-outline-variant text-xs">reason</p>
            <button class="... w-full mt-1">Unban User</button>
          </div>
          ...
        </div>
      </div>
    </section>

  Read + unban only -- initiating a ban lives on the Members page
  (MemberActionsMenu reuses this feature's own BanMemberDialog/
  banMember, see MembersPage.jsx), not duplicated here as a "moderate
  members" list; Stitch's own Restricted card never showed one either.
  Subject is always a registered User or a durable GuestIdentity
  (apps.trips.governance.ban_member()) -- never "Unknown Device"/IP,
  which Stitch's own mock content is NOT ported here (real data only).
  Reason is administrative -- shown here because this section only
  ever renders behind can_view_governance; never surfaced in general
  Activity.
*/
export default function BansSection({ bans, onUnban, canUnban }) {
  const { t, i18n } = useTranslation();
  const activeBans = bans.filter((b) => b.active);
  return (
    <section className="gov-restricted">
      <div className="gov-restricted__corner" aria-hidden="true" />
      <div className="gov-restricted__content">
        <div className="gov-section-head">
          <span className="material-symbols-outlined gov-section-head__icon gov-section-head__icon--danger" aria-hidden="true">block</span>
          <h2 className="gov-section-head__title">{t('governance.bans')}</h2>
        </div>
        {activeBans.length > 0 ? (
          <ul className="gov-restricted-list">
            {activeBans.map((b) => (
              <li className="gov-restricted-row" key={b.id}>
                <div>
                  <span className="gov-restricted-row__name">{b.member?.display_name || t('activity.unknown')}</span>
                  <p className={`gov-restricted-row__type${b.expires_at ? '' : ' gov-restricted-row__type--permanent'}`}>
                    {b.expires_at ? t('governance.temporaryUntil', { date: formatDateTime(b.expires_at, i18n.language) }) : t('governance.permanent')}
                  </p>
                  {b.member && <p className="gov-restricted-row__meta">{t(`identity.${b.member.identity_type}`)}{b.banned_by && ` · ${t('governance.bannedBy', { name: b.banned_by.display_name })}`}</p>}
                </div>
                {b.reason && <p className="gov-restricted-row__reason">{b.reason}</p>}
                {canUnban && <button type="button" className="gov-btn gov-btn--compact" onClick={() => onUnban(b)}>{t('governance.unban')}</button>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="gov-empty">{t('governance.noBans')}</p>
        )}
      </div>
    </section>
  );
}
