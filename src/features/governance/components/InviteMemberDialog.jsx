import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import useModalDialog from '../../../shared/hooks/useModalDialog';

// A practical email-shape check (not an RFC-5322 parser) -- requires a
// non-space local part, an @, and a domain with at least one dot. Real
// deliverability is only ever confirmed server-side; this only catches
// obviously malformed input before a round trip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps the backend's structured error codes (apps.trips.governance.
// create_invitation) onto an inline, field-level message -- never a
// raw code or a generic toast for something the user can fix by
// editing the email they just typed.
const EMAIL_ERROR_KEY_BY_CODE = {
  already_member: 'governance.inviteErrorAlreadyMember',
  email_banned: 'governance.inviteErrorBanned',
};

/*
  Canonical "Add Member" modal -- replaces the old bare inline form.
  Two distinct, coexisting invite mechanisms, both already backed by
  TripInvitation (see docs/api/join-and-invitations.md):
    A) Email invitation -- bound to one normalized email, single-use.
       The primary path -- the dialog's own subtitle/label/helper all
       exist specifically so the user never has to guess whether this
       field wants a name or an email.
    B) A single-use guest link (email=None) -- for someone you can't
       reach by email yet. Distinct from Governance's own reusable
       "Invite Link Active" (Trip.join_code, managed in
       AccessSettingsCard) -- that one is the trip's standing open
       door; this one is a single, revocable, per-person token. Kept
       as a clearly secondary action behind an "or" divider, never
       competing visually with the primary Send Invite button.
  Neither path is invented here -- onInvite is the same createInvitation
  call the old inline form already used; GovernancePage now calls it
  directly (bypassing its run() helper) specifically so a real
  rejection reaches this component's own try/catch instead of being
  swallowed into a page-level banner before it can be mapped inline.
*/
const InviteMemberDialog = ({ onInvite, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailErrorKey, setEmailErrorKey] = useState(null);
  const [sending, setSending] = useState(false);
  const [guestLink, setGuestLink] = useState('');
  const [errorKey, setErrorKey] = useState(null);
  const dialogRef = useModalDialog(onClose, { closeDisabled: sending });

  const trimmedEmail = email.trim();
  const emailShapeInvalid = trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);

  const validateEmail = () => {
    if (!trimmedEmail) return 'governance.inviteErrorEmpty';
    if (!EMAIL_PATTERN.test(trimmedEmail)) return 'governance.inviteErrorInvalid';
    return null;
  };

  const sendEmailInvite = async (event) => {
    event.preventDefault();
    if (sending) return;
    const validationErrorKey = validateEmail();
    if (validationErrorKey) {
      setEmailErrorKey(validationErrorKey);
      return;
    }
    setSending(true);
    setEmailErrorKey(null);
    setErrorKey(null);
    try {
      await onInvite({ email: trimmedEmail });
      onClose();
    } catch (error) {
      const mappedKey = EMAIL_ERROR_KEY_BY_CODE[error?.code];
      if (mappedKey) setEmailErrorKey(mappedKey);
      else setErrorKey('governance.inviteFailed');
      // Email is deliberately never cleared here -- a failed submit
      // (validation or server) always preserves what the user typed.
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
            <div>
              <h2 id="invite-member-dialog-title" className="text-headline">{t('governance.addMember')}</h2>
              <p className="text-copy-sm governance-dialog__subtitle">{t('governance.inviteSubtitle')}</p>
            </div>
            <button type="button" className="governance-dialog__close" aria-label={t('common.close')} onClick={onClose} disabled={sending}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={sendEmailInvite} className="field-group" noValidate>
            <label className="field-label" htmlFor="invite-email">{t('governance.inviteEmail')}</label>
            <input
              id="invite-email"
              className="field-control"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailErrorKey(null); }}
              onBlur={() => setEmailErrorKey(validateEmail())}
              placeholder="name@example.com"
              dir="ltr"
              autoComplete="email"
              inputMode="email"
              required
              disabled={sending}
              aria-invalid={Boolean(emailErrorKey)}
              aria-describedby={emailErrorKey ? 'invite-email-error' : 'invite-email-helper'}
            />
            {emailErrorKey ? (
              <p id="invite-email-error" className="text-copy-sm governance-dialog__field-error" role="alert">{t(emailErrorKey)}</p>
            ) : (
              <p id="invite-email-helper" className="text-copy-sm governance-dialog__field-helper">{t('governance.inviteEmailHelper')}</p>
            )}
            <button type="submit" className={`dash-btn dash-btn--primary${sending ? ' dash-btn--loading' : ''}`} disabled={sending || !trimmedEmail || emailShapeInvalid}>
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
        </div>
      </div>
    </ModalPortal>
  );
};

export default InviteMemberDialog;
