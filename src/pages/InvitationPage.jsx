import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/Layout/PublicLayout';
import '../styles/CardStyles.css';
import '../styles/legacyShell.css';
import { acceptInvitation, getInvitation } from '../features/invitations/api/invitationsApi';
import { useAuth } from '../auth/AuthContext';
import { buildAuthUrl } from '../auth/safeNext';
import ProfileSetupPage from '../features/profile/pages/ProfileSetupPage';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  useEffect(() => { getInvitation(token).then(setInvite).catch((err) => setError(err.response?.data?.message || t('invite.invalid'))); }, [token, t]);
  const accept = useCallback(async (payload) => { if (accepting) return; setAccepting(true); try { const result = await acceptInvitation(token, payload); navigate(`/trip/${result.trip.id}`); } catch (err) { setError(err.response?.data?.message || t('invite.invalid')); setAccepting(false); } }, [accepting, navigate, t, token]);
  useEffect(() => { if (invite?.valid && invite.email_required && user && !authLoading) accept({}); }, [invite, user, authLoading, accept]); // resumes after OTP/onboarding
  // Only ever used from the email_required branch below, so the Auth
  // Gateway is told up front (guest=0) to hide "Continue as guest" and
  // explain why — guest continuation would just bounce back here still
  // unauthenticated, since acceptance for this invitation is backend-gated
  // on the signed-in email, not a frontend check.
  const login = () => navigate(`${buildAuthUrl(`/invite/${token}`)}&guest=0`);
  const submitGuestProfile = (profile) => {
    const { display_name, ...avatarFields } = profile;
    accept({ guest_name: display_name, ...avatarFields });
  };

  // Guest-invite links (no signed-in email required) reuse the same
  // profile/avatar onboarding component as Create/Join Trip's guest flow
  // and registered Complete Profile — never a redirect to Home in between.
  if (invite?.valid && !invite.email_required) {
    return <ProfileSetupPage busy={accepting} errorKey={error ? 'invite.invalid' : null} onSubmit={submitGuestProfile} mode="guest" />;
  }

  return (
    <PublicLayout>
      <div className="legacy-shell">
        <main className="home-container-pc mt-5">
          <section className="card-pc">
            <h2>{t('invite.title')}</h2>
            {error && <div className="error-message" role="alert">{error}</div>}
            {invite && (
              <>
                <p>{t('invite.trip', { name: invite.trip_title })}</p>
                {!invite.valid ? (
                  <p>{t('invite.invalid')}</p>
                ) : invite.email_required ? (
                  !user && !authLoading ? (
                    <button type="button" className="pc-btn-create" onClick={login}>{t('invite.continueEmail')}</button>
                  ) : (
                    <p>{t('invite.accepting')}</p>
                  )
                ) : null}
              </>
            )}
          </section>
        </main>
      </div>
    </PublicLayout>
  );
};

export default InvitationPage;
