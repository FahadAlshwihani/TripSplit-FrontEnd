import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/Layout/PublicLayout';
import NeoLoading from '../shared/components/NeoLoading';
import LoadingButton from '../shared/components/LoadingButton';
import OtpStep from '../features/auth/components/OtpStep';
import ProfileSetupPage from '../features/profile/pages/ProfileSetupPage';
import TripJoinPreview from '../features/join/components/TripJoinPreview';
import { acceptInvitation } from '../features/invitations/api/invitationsApi';
import { requestInvitationOtp, verifyInvitationOtp } from '../features/join/api/joinApi';
import useJoinCapability from '../features/join/hooks/useJoinCapability';
import { getOtpErrorKey, getProfileErrorKey } from '../features/auth/authErrors';
import { useAuth } from '../auth/AuthContext';
import '../features/join/styles/joinTrip.css';

const RESEND_SECONDS = 60;

const INVALID_REASON_KEYS = { revoked: 'invitation.revoked', expired: 'invitation.expired', used: 'invitation.used' };

/*
  Capability-driven, matching JoinTripPage's state machine and reusing
  its TripJoinPreview -- invitation is another capability state of the
  same product flow, not a parallel implementation. The token route
  param is fed straight into useJoinCapability (a long non-URL token
  always parses as mode:"token", see parseJoinInput).

  needs_email_verification is further split by matches_current_session.
  An already-matching authenticated session skips straight to the
  confirmation card below (no OTP needed -- a live session is already
  this app's trust boundary everywhere else) but still requires an
  explicit JOIN TRIP click, never a silent auto-accept: the invitation
  is pre-approval, not pre-membership. Anonymous (matches_current_session:
  null) goes through a TRIP_INVITE-purpose OTP scoped to this specific
  invitation (the target email is fixed server-side, never typed) before
  reaching that same confirmation card. A mismatched authenticated
  session gets a safe "sign out and continue with the invited email"
  state instead of silently failing or exposing the full invited address.
*/
const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { authLoading, setUser, saveProfile, logout } = useAuth();

  const { data: capability, loading: capabilityLoading, error: capabilityError, retry } = useJoinCapability(token);

  const [otpId, setOtpId] = useState(null);
  const [otpStarted, setOtpStarted] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpErrorKey, setOtpErrorKey] = useState(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrorKey, setProfileErrorKey] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const autoRequestedRef = useRef(false);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const accept = async (payload) => {
    if (accepting) return;
    setAccepting(true);
    setAcceptError('');
    try {
      const result = await acceptInvitation(token, payload);
      navigate(`/trips/${result.trip.id}/overview`);
    } catch (err) {
      setAcceptError(err.message || t('invite.invalid'));
      setAccepting(false);
    }
  };

  const matchesSession = capability?.action === 'needs_email_verification' ? capability.matches_current_session : null;

  // Anonymous + email-bound: request the invitation-scoped OTP once, the
  // moment we know it's needed -- the target email is fixed server-side,
  // there's nothing for the user to type before this can fire.
  useEffect(() => {
    if (matchesSession === null && capability?.action === 'needs_email_verification' && !otpStarted && !autoRequestedRef.current) {
      autoRequestedRef.current = true;
      requestOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchesSession, capability?.action]);

  const requestOtp = async () => {
    setIsSendingOtp(true);
    setOtpErrorKey(null);
    try {
      const result = await requestInvitationOtp(token);
      setOtpId(result.otp_id);
      setOtpStarted(true);
      setResendSeconds(RESEND_SECONDS);
    } catch (err) {
      setOtpErrorKey(getOtpErrorKey(err, 'invitation.otpFailed'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resendOtp = async () => {
    setIsResendingOtp(true);
    setOtpErrorKey(null);
    try {
      const result = await requestInvitationOtp(token);
      setOtpId(result.otp_id);
      setResendSeconds(RESEND_SECONDS);
    } catch (err) {
      setOtpErrorKey(getOtpErrorKey(err, 'invitation.otpFailed'));
    } finally {
      setIsResendingOtp(false);
    }
  };

  const verifyOtp = async (code) => {
    setIsVerifyingOtp(true);
    setOtpErrorKey(null);
    try {
      const result = await verifyInvitationOtp(token, { otp_id: otpId, code });
      setUser(result.user);
      if (result.onboarding_required) {
        setNeedsProfile(true);
      } else {
        setOtpStarted(false);
        retry();
      }
    } catch (err) {
      setOtpErrorKey(getOtpErrorKey(err, 'invitation.otpFailed'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const submitProfile = async (profile) => {
    setIsSavingProfile(true);
    setProfileErrorKey(null);
    try {
      await saveProfile(profile);
      setNeedsProfile(false);
      retry();
    } catch (err) {
      setProfileErrorKey(getProfileErrorKey(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const signOutAndContinue = async () => {
    await logout();
    autoRequestedRef.current = false;
    setOtpStarted(false);
    retry();
  };

  const submitGuestProfile = (profile) => {
    const { display_name, ...avatarFields } = profile;
    accept({ guest_name: display_name, ...avatarFields });
  };

  if (needsProfile) {
    return <ProfileSetupPage busy={isSavingProfile} errorKey={profileErrorKey} onSubmit={submitProfile} />;
  }

  if (matchesSession === null && otpStarted) {
    return (
      <OtpStep
        email={capability.masked_email}
        isVerifying={isVerifyingOtp}
        isResending={isResendingOtp}
        errorKey={otpErrorKey}
        resendSeconds={resendSeconds}
        onSubmit={verifyOtp}
        onResend={resendOtp}
        onBack={() => navigate('/')}
      />
    );
  }

  if (capability?.action === 'ready_open') {
    return <ProfileSetupPage busy={accepting} errorKey={acceptError ? 'invite.invalid' : null} onSubmit={submitGuestProfile} mode="guest" />;
  }

  return (
    <PublicLayout>
      <div className="jt-page">
        <header className="jt-header">
          <button type="button" className="jt-back" onClick={() => navigate('/')} aria-label={t('common.cancel')}>
            <i className="bi bi-arrow-left jt-back__icon" aria-hidden="true" />
          </button>
          <h1 className="jt-title text-display">{t('joinTrip.pageTitle')}</h1>
        </header>

        <div className="jt-card">
          {(capabilityLoading || authLoading || isSendingOtp) ? (
            <NeoLoading />
          ) : capabilityError ? (
            <p className="jt-error" role="alert">{t('invite.invalid')}</p>
          ) : capability ? (
            <>
              {capability.action === 'invalid_or_expired_invite' && (
                <>
                  <p className="jt-error" role="alert">{t(INVALID_REASON_KEYS[capability.invalid_reason] || 'invite.invalid')}</p>
                  <div className="jt-actions">
                    <button type="button" className="jt-btn jt-btn--secondary" onClick={() => navigate('/')}>{t('common.cancel')}</button>
                    <button type="button" className="jt-btn jt-btn--primary" onClick={() => navigate('/trips/join')}>{t('joinTrip.findTrip')}</button>
                  </div>
                </>
              )}

              {capability.action === 'already_member' && (
                <>
                  <p className="jt-status text-copy">{t('joinTrip.states.alreadyMember')}</p>
                  <div className="jt-actions">
                    <button type="button" className="jt-btn jt-btn--primary" onClick={() => navigate(`/trips/${capability.trip_id}/overview`)}>
                      {t('joinTrip.openTrip')}
                    </button>
                  </div>
                </>
              )}

              {capability.action === 'banned' && (
                <p className="jt-error" role="alert">
                  {capability.banned_until ? t('joinTrip.states.bannedUntil', { date: new Date(capability.banned_until).toLocaleString() }) : t('joinTrip.states.banned')}
                </p>
              )}

              {matchesSession === false && (
                <>
                  <p className="jt-status text-copy">{t('invitation.wrongAccount.title')}</p>
                  <div className="jt-actions">
                    <button type="button" className="jt-btn jt-btn--primary" onClick={signOutAndContinue}>{t('invitation.wrongAccount.action')}</button>
                  </div>
                </>
              )}

              {matchesSession === true && (
                <>
                  <span className="text-label jt-status">{t('invitation.youreInvited')}</span>
                  <TripJoinPreview trip={capability.trip} />
                  {capability.masked_email && (
                    <p className="jt-status text-copy-sm">{t('invitation.invitedAs', { email: capability.masked_email })}</p>
                  )}
                  {acceptError && <p className="jt-error" role="alert">{acceptError}</p>}
                  <div className="jt-actions">
                    <button type="button" className="jt-btn jt-btn--secondary" onClick={() => navigate('/')}>{t('common.cancel')}</button>
                    <LoadingButton
                      type="button"
                      className="jt-btn jt-btn--primary"
                      loading={accepting}
                      loadingLabel={t('joinTrip.joiningLoading')}
                      onClick={() => accept({})}
                    >
                      <span>{t('joinTrip.joinTripButton')}</span>
                      <i className="bi bi-arrow-right jt-submit__icon" aria-hidden="true" />
                    </LoadingButton>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </PublicLayout>
  );
};

export default InvitationPage;
