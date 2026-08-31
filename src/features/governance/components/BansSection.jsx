import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatDateTime } from '../../../shared/utils/format';

/*
  Read + unban only -- initiating a ban lives on the Members page
  (MemberActionsMenu reuses this feature's own BanMemberDialog/
  banMember, see MembersPage.jsx), not duplicated here as a "moderate
  members" list; the Stitch reference's own Restricted card never
  showed one either. Rows show identity type, duration (temporary/
  permanent -- never expiry vs "Unknown Device"/IP the way Stitch's
  mock did; the subject is always a registered User or a durable
  GuestIdentity, see apps.trips.governance.ban_member()), and who
  banned them. Reason is administrative -- shown here because this
  section only ever renders on the Governance page, already gated to
  can_view_governance; never surfaced in general Activity.
*/
export default function BansSection({ bans, onUnban, canUnban }) {
  const { t, i18n } = useTranslation();
  const activeBans = bans.filter((b) => b.active);
  return (
    <>
      <div className="gov-section-head">
        <h2 className="gov-section-head__title text-headline-sm"><i className="bi bi-slash-circle-fill" aria-hidden="true" /> {t('governance.bans')}</h2>
      </div>
      {activeBans.length > 0 ? (
        <ul className="gov-list gov-list--restricted">
          {activeBans.map((b) => (
            <li className="governance-ban-row" key={b.id}>
              <div className="governance-ban-row__identity">
                <span className="member-avatar">{b.member && <Avatar avatarKey={avatarKeyFromAvatar(b.member.avatar)} displayName={b.member.display_name} size="sm" />}</span>
                <div>
                  <strong>{b.member?.display_name || t('activity.unknown')}</strong>
                  <small className="governance-ban-row__meta">
                    {b.member && <>{t(`identity.${b.member.identity_type}`)} · </>}
                    {b.expires_at ? t('governance.temporaryUntil', { date: formatDateTime(b.expires_at, i18n.language) }) : t('governance.permanent')}
                  </small>
                  {b.banned_by && <small className="governance-ban-row__meta">{t('governance.bannedBy', { name: b.banned_by.display_name })}</small>}
                  {b.reason && <small className="governance-ban-row__reason">{b.reason}</small>}
                </div>
              </div>
              {canUnban && <button type="button" className="dash-btn dash-btn--secondary gov-unban-btn" onClick={() => onUnban(b)}>{t('governance.unban')}</button>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="gov-empty text-copy-sm">{t('governance.noBans')}</p>
      )}
    </>
  );
}
