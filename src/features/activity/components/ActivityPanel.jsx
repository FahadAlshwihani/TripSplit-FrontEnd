import React from 'react';
import { useTranslation } from 'react-i18next';
import { avatarGlyph } from '../../../shared/utils/avatars';

const ActivityPanel = ({ events }) => {
  const { t } = useTranslation();
  return <section className="card-pc"><h2>{t('activity.title')}</h2>{events.length ? events.map((event) => <div className="activity-row" key={event.id}><span className="member-avatar">{event.actor ? avatarGlyph(event.actor.avatar_key) : '•'}</span><div><strong>{event.actor?.display_name || t('activity.system')}</strong><p>{t(`activity.${event.event_type}`, event.summary)}</p><small>{new Date(event.created_at).toLocaleString()}</small></div></div>) : <p>{t('activity.empty')}</p>}</section>;
};
export default ActivityPanel;
