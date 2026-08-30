import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatDateTime } from '../../../shared/utils/format';

/*
  Restricted/banned rows show identity type, duration (temporary/
  permanent -- never expiry vs "Unknown Device" the way Stitch's
  reference did; the subject is always a registered User or a durable
  GuestIdentity, see apps.trips.governance.ban_member()), and who
  banned them. Reason is administrative -- shown here because this
  section only ever renders on the Governance page, already gated to
  Owner/Admin (canManageMembers); never surfaced in general Activity.
*/
export default function BansSection({ members, bans, onKick, onBan, onUnban }) {
  const { t, i18n } = useTranslation();
  const moderable = members.filter((m) => m.active !== false && (m.capabilities?.can_remove || m.capabilities?.can_ban));
  const activeBans = bans.filter((b) => b.active);
  return (
    <section>
      <h3>{t('governance.moderation')}</h3>
      {moderable.map((m) => (
        <div className="management-row" key={m.id}>
          <span className="member-avatar"><Avatar avatarKey={avatarKeyFromAvatar(m.avatar)} displayName={m.display_name} size="sm" /> {m.display_name}</span>
          <div className="row-actions">
            {m.capabilities?.can_remove && <button onClick={() => onKick(m)}>{t('governance.kick')}</button>}
            {m.capabilities?.can_ban && <button onClick={() => onBan(m)}>{t('governance.confirmBanAction')}</button>}
          </div>
        </div>
      ))}
      <h3>{t('governance.bans')}</h3>
      {activeBans.map((b) => (
        <div className="governance-ban-row" key={b.id}>
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
          <button onClick={() => onUnban(b)}>{t('governance.unban')}</button>
        </div>
      ))}
      {!activeBans.length && <p>{t('governance.noBans')}</p>}
    </section>
  );
}
