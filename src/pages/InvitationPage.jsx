import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/Layout/PublicLayout';
import '../styles/CardStyles.css';
import '../styles/legacyShell.css';
import NeoLoading from '../shared/components/NeoLoading';
import OtpStep from '../features/auth/components/OtpStep';
import ProfileSetupPage from '../features/profile/pages/ProfileSetupPage';
import { acceptInvitation } from '../features/invitations/api/invitationsApi';
import { requestInvitationOtp, verifyInvitationOtp } from '../features/join/api/joinApi';
import useJoinCapability from '../features/join/hooks/useJoinCapability';
import { getOtpErrorKey, getProfileErrorKey } from '../features/auth/authErrors';
import { useAuth } from '../auth/AuthContext';

const RESEND_SECONDS = 60;

const INVALID_REASON_KEYS = { revoked: 'invitation.revoked', expired: 'invitation.expired', used: 'invitation.used' };

/*
  Capability-driven, matching JoinTripPage's state machine -- the token
  route param is fed straight into useJoinCapability (a long non-URL
  token always parses as mode:"token", see parseJoinInput), so both pages
  share one authoritative source of truth for "what can this identity do
  with this trip" instead of each inventing its own client-side checks.

  The one addition specific to invitations: needs_email_verification is
  further split by matches_current_session. An already-matching
  authenticated session fast-paths straight to accept() -- a live session
  is already this app's trust boundary everywhere else, so this adds no
  extra friction. Anonymous (matches_current_session: null) goes through
  a TRIP_INVITE-purpose OTP scoped to this specific invitation (the
  target email is fixed server-side, never typed) before accepting.
  A mismatched authenticated session (matches_current_session: false)
  gets a safe "sign out and continue with the invited email" state
  instead of silently failing or exposing the full invited address.
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

  // Fast path: already-matching authenticated session, no OTP needed.
  useEffect(() => {
    if (matchesSession === true && !accepting) accept({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchesSession]);

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
      <div className="legacy-shell">
        <main className="home-container-pc mt-5">
          <section className="card-pc">
            <h2>{t('invite.title')}</h2>
            {(capabilityLoading || authLoading || isSendingOtp) && <NeoLoading />}
            {!capabilityLoading && capabilityError && <div className="error-message" role="alert">{t('invite.invalid')}</div>}
            {acceptError && <div className="error-message" role="alert">{acceptError}</div>}

            {!capabilityLoading && capability && (
              <>
                <p>{t('invite.trip', { name: capability.trip.title })}</p>

                {capability.action === 'invalid_or_expired_invite' && (
                  <p>{t(INVALID_REASON_KEYS[capability.invalid_reason] || 'invite.invalid')}</p>
                )}

                {capability.action === 'already_member' && (
                  <>
                    <p>{t('joinTrip.states.alreadyMember')}</p>
                    <button type="button" className="pc-btn-create" onClick={() => navigate(`/trips/${capability.trip_id}/overview`)}>
                      {t('joinTrip.openTrip')}
                    </button>
                  </>
                )}

                {capability.action === 'banned' && (
                  <p role="alert">
                    {capability.banned_until ? t('joinTrip.states.bannedUntil', { date: new Date(capability.banned_until).toLocaleString() }) : t('joinTrip.states.banned')}
                  </p>
                )}

                {matchesSession === true && !accepting && <p>{t('invite.accepting')}</p>}

                {matchesSession === false && (
                  <>
                    <p>{t('invitation.wrongAccount.title')}</p>
                    <button type="button" className="pc-btn-create" onClick={signOutAndContinue}>
                      {t('invitation.wrongAccount.action')}
                    </button>
                  </>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </PublicLayout>
  );
};

export default InvitationPage;
