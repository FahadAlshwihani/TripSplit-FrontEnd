import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import { formatRelativeTime } from '../../../shared/utils/format';

/*
  Every TripJoinRequest in this codebase is created through the same
  approval-required join-code path (apps.trips.governance.
  create_join_request) -- there is no other route that produces one --
  so "via invite link" below is a real, honest fact about every row,
  not an invented per-row source label the backend can't actually tell
  apart (see the brief's "safe source context" rule). Relative time
  ("8 minutes ago"), not a raw formatted timestamp -- matches the
  density of a compact administrative row.
*/
export default function JoinRequestsSection({ requests, onReview, canReview }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <div className="gov-section-head">
        <h2 className="gov-section-head__title">
          <i className="bi bi-person-plus-fill" aria-hidden="true" /> {t('governance.requests')}
          {requests.length > 0 && <span className="gov-count-badge">{requests.length}</span>}
        </h2>
      </div>
      <div className={`gov-section-body${requests.length > 0 ? '' : ' gov-section-body--empty'}`}>
        {requests.length > 0 ? (
          <ul className="gov-list">
            {requests.map((row) => (
              <li className="gov-row" key={row.id}>
                <div className="gov-row__identity">
                  <Avatar avatarKey={avatarKeyFromAvatar(row.avatar)} displayName={row.display_name} size="sm" />
                  <div className="gov-row__text">
                    <span className="gov-row__name">
                      {row.display_name}
                      {row.identity_type === 'guest' && <span className="gov-badge">{t('identity.guest')}</span>}
                    </span>
                    <span className="gov-row__meta">{t('governance.requestedMeta', { date: formatRelativeTime(row.requested_at, i18n.language) })}</span>
                  </div>
                </div>
                {canReview && (
                  <div className="gov-row__actions">
                    <button type="button" className="dash-btn dash-btn--secondary" onClick={() => onReview(row, 'reject')}>{t('governance.reject')}</button>
                    <button type="button" className="dash-btn dash-btn--primary" onClick={() => onReview(row, 'approve')}>{t('governance.approve')}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="gov-list gov-list--empty">
            <p className="gov-empty text-copy-sm">{t('governance.noRequests')}</p>
          </div>
        )}
      </div>
    </>
  );
}
