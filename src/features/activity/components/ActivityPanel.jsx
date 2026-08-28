import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatDateTime } from '../../../shared/utils/format';

const ActivityPanel = ({ events }) => {
  const { t, i18n } = useTranslation();
  return <section className="card-pc"><h2>{t('activity.title')}</h2>{events.length ? events.map((event) => <div className="activity-row" key={event.id}><span className="member-avatar">{event.actor ? <Avatar avatarKey={avatarKeyFromAvatar(event.actor.avatar)} displayName={event.actor.display_name} size="sm" /> : '•'}</span><div><strong>{event.actor?.display_name || t('activity.system')}</strong><p>{t(`activity.${event.event_type}`, event.summary)}</p><small><bdi dir="ltr">{formatDateTime(event.created_at, i18n.language)}</bdi></small></div></div>) : <p>{t('activity.empty')}</p>}</section>;
};
export default ActivityPanel;
