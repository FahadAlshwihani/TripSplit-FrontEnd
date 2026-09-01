import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../shared/utils/format';

export default function InvitationsSection({ invitations, onOpenInvite, onResend, onRevoke, canInvite, canResend, canRevoke }) {
  const { t } = useTranslation();
  const live = invitations.filter((row) => !row.accepted_at && !row.revoked_at);
  return (
    <>
      <div className="gov-section-head">
        <h2 className="gov-section-head__title text-headline-sm"><i className="bi bi-envelope-fill" aria-hidden="true" /> {t('governance.invitations')}</h2>
        {canInvite && (
          <button type="button" className="gov-text-action" onClick={onOpenInvite}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> {t('governance.addMember')}
          </button>
        )}
      </div>
      <div className={`gov-section-body${live.length > 0 ? '' : ' gov-section-body--empty'}`}>
        {live.length > 0 ? (
          <ul className="gov-list">
            {live.map((row) => (
              <li className="gov-row" key={row.id}>
                <div className="gov-row__text">
                  <span className="gov-row__name">
                    {row.email ? <bdi dir="ltr">{row.email}</bdi> : t('governance.guestInvite')}
                  </span>
                  <span className="gov-row__meta">{t('governance.sentByOn', { name: row.invited_by?.display_name || t('activity.unknown'), date: formatDate(row.created_at) })}</span>
                </div>
                <div className="gov-row__actions">
                  {canRevoke && <button type="button" className="dash-btn dash-btn--secondary" onClick={() => onRevoke(row)}>{t('governance.revoke')}</button>}
                  {canResend && row.email && (
                    <button type="button" className="dash-btn dash-btn--secondary" onClick={() => onResend(row)}>
                      <i className="bi bi-send" aria-hidden="true" /> {t('governance.resend')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="gov-empty text-copy-sm">{t('governance.noInvitations')}</p>
        )}
      </div>
    </>
  );
}
