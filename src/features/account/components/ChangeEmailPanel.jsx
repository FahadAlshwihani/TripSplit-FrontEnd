import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingButton from '../../../shared/components/LoadingButton';
import { requestEmailChange, verifyEmailChange } from '../../auth/api/authApi';

/*
  Neo-classic replacement for the legacy inline change-email JSX that used
  to live directly in pages/ProfilePage.jsx -- same two-step OTP flow
  (apps.accounts.views.email_change_request_view / _verify_view), unchanged
  server contract, just restyled and given real loading/error UX instead of
  bare <input>s with no feedback states.
*/
const ChangeEmailPanel = ({ onDone }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const sendCode = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setErrorKey(null);
    try {
      const result = await requestEmailChange(email);
      setOtpId(result.otp_id);
    } catch {
      setErrorKey('account.errors.emailChangeFailed');
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async (event) => {
    event.preventDefault();
    if (confirming) return;
    setConfirming(true);
    setErrorKey(null);
    try {
      await verifyEmailChange({ otp_id: otpId, email, code });
      onDone?.();
    } catch {
      setErrorKey('account.errors.emailChangeFailed');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <form className="acc-change-email" onSubmit={otpId ? confirmCode : sendCode}>
      {!otpId ? (
        <>
          <label className="acc-preferences__label text-copy" htmlFor="acc-new-email">{t('account.identity.newEmail')}</label>
          <input id="acc-new-email" className="acc-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <LoadingButton type="submit" className="acc-btn acc-btn--primary" loading={sending} loadingLabel={t('account.identity.sending')}>
            {t('account.identity.sendCode')}
          </LoadingButton>
        </>
      ) : (
        <>
          <label className="acc-preferences__label text-copy" htmlFor="acc-email-code">{t('account.identity.enterCode')}</label>
          <input id="acc-email-code" className="acc-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} maxLength={6} required />
          <LoadingButton type="submit" className="acc-btn acc-btn--primary" loading={confirming} loadingLabel={t('account.identity.confirming')}>
            {t('account.identity.confirmCode')}
          </LoadingButton>
        </>
      )}
      {errorKey && <p className="acc-error" role="alert">{t(errorKey)}</p>}
    </form>
  );
};

export default ChangeEmailPanel;
