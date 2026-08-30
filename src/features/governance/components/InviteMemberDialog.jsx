import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import useModalDialog from '../../../shared/hooks/useModalDialog';

/*
  Canonical "Add Member" modal -- replaces the old bare inline form.
  Two distinct, coexisting invite mechanisms, both already backed by
  TripInvitation (see docs/api/join-and-invitations.md):
    A) Email invitation -- bound to one normalized email, single-use.
    B) A single-use guest link (email=None) -- for someone you can't
       reach by email yet. Distinct from Governance's own reusable
       "Invite Link Active" (Trip.join_code, managed in
       AccessSettingsCard) -- that one is the trip's standing open
       door; this one is a single, revocable, per-person token.
  Neither path is invented here -- onInvite is the same createInvitation
  call the old inline form already used.
*/
const InviteMemberDialog = ({ onInvite, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [guestLink, setGuestLink] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const dialogRef = useModalDialog(onClose, { closeDisabled: sending });

  const sendEmailInvite = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setErrorKey(null);
    try {
      await onInvite({ email });
      onClose();
    } catch {
      setErrorKey('governance.inviteFailed');
    } finally {
      setSending(false);
    }
  };

  const generateGuestLink = async () => {
    if (sending) return;
    setSending(true);
    setErrorKey(null);
    try {
      const result = await onInvite({});
      if (result?.token) setGuestLink(`${window.location.origin}/invite/${result.token}`);
    } catch {
      setErrorKey('governance.inviteFailed');
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalPortal>
      <div className="governance-dialog-overlay" role="presentation" onClick={() => !sending && onClose()}>
        <div ref={dialogRef} tabIndex={-1} className="governance-dialog" role="dialog" aria-modal="true" aria-labelledby="invite-member-dialog-title" onClick={(event) => event.stopPropagation()}>
          <div className="governance-dialog__head">
            <h2 id="invite-member-dialog-title" className="text-headline">{t('governance.addMember')}</h2>
            <button type="button" className="dialog-close" aria-label={t('common.close')} onClick={onClose} disabled={sending}>×</button>
          </div>

          <form onSubmit={sendEmailInvite} className="field-group">
            <label className="field-label" htmlFor="invite-email">{t('governance.inviteEmail')}</label>
            <input id="invite-email" className="field-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={sending} />
            <button type="submit" className={`dash-btn dash-btn--primary${sending ? ' dash-btn--loading' : ''}`} disabled={sending}>
              {sending && <span className="dash-btn__spinner" aria-hidden="true" />}
              {t('governance.sendInvite')}
            </button>
          </form>

          <div className="governance-dialog__divider text-copy-sm">{t('governance.or')}</div>

          <div className="field-group">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={generateGuestLink} disabled={sending}>
              {t('governance.guestLink')}
            </button>
            {guestLink && (
              <>
                <label className="field-label" htmlFor="invite-guest-link">{t('governance.copyOnce')}</label>
                <input id="invite-guest-link" className="field-control" readOnly value={guestLink} onFocus={(event) => event.target.select()} dir="ltr" />
              </>
            )}
          </div>

          {errorKey && <p className="text-copy-sm governance-dialog__error" role="alert">{t(errorKey)}</p>}

          <div className="governance-dialog__footer">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={sending}>{t('common.close')}</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default InviteMemberDialog;
