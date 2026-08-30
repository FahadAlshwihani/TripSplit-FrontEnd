import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatDateTime } from '../../../shared/utils/format';

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
        <div className="management-row" key={b.id}>
          <span className="member-avatar">
            {b.member && <Avatar avatarKey={avatarKeyFromAvatar(b.member.avatar)} displayName={b.member.display_name} size="sm" />}
            {' '}{b.member?.display_name || t('activity.unknown')}
            <small>{b.expires_at ? formatDateTime(b.expires_at, i18n.language) : t('governance.permanent')}</small>
          </span>
          <button onClick={() => onUnban(b)}>{t('governance.unban')}</button>
        </div>
      ))}
      {!activeBans.length && <p>{t('governance.noBans')}</p>}
    </section>
  );
}
