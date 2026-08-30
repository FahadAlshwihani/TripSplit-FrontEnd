import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../shared/utils/format';

export default function InvitationsSection({ invitations, onOpenInvite, onResend, onRevoke }) {
  const { t } = useTranslation();
  return (
    <section>
      <div className="governance-section-head">
        <h3>{t('governance.invitations')}</h3>
        <button type="button" className="dash-btn dash-btn--primary" onClick={onOpenInvite}>{t('governance.addMember')}</button>
      </div>
      {invitations.map((row) => (
        <div className="management-row" key={row.id}>
          <span>
            {row.email ? <bdi dir="ltr">{row.email}</bdi> : t('governance.guestInvite')}
            <small>{formatDate(row.expires_at)}</small>
          </span>
          {!row.accepted_at && !row.revoked_at && (
            <div className="row-actions">
              {row.email && <button onClick={() => onResend(row)}>{t('governance.resend')}</button>}
              <button onClick={() => onRevoke(row)}>{t('governance.revoke')}</button>
            </div>
          )}
        </div>
      ))}
      {!invitations.length && <p>{t('governance.noInvitations')}</p>}
    </section>
  );
}
