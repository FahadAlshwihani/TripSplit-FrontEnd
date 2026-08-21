import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/Layout/PublicLayout';
import '../styles/CardStyles.css';
import '../styles/legacyShell.css';
import { requestOtp, verifyOtp } from '../features/auth/api/authApi';
import { useAuth } from '../auth/AuthContext';
import { AVATARS } from '../shared/utils/avatars';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next');
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
  const { setUser, saveProfile } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState(null);
  const [code, setCode] = useState('');
  const [profile, setProfile] = useState({ first_name: '', last_name: '', avatar_key: 'avatar_01' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  useEffect(() => { if (!resendSeconds) return undefined; const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [resendSeconds]);

  const submitEmail = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await requestOtp(email); setOtpId(result.otp_id); setStep('otp'); setResendSeconds(60); }
    catch (err) { setError(err.response?.data?.message || 'Could not send a verification code.'); }
    finally { setBusy(false); }
  };
  const submitOtp = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const result = await verifyOtp({ otp_id: otpId, email, code }); setUser(result.user); if (result.onboarding_required) setStep('profile'); else navigate(safeNext); }
    catch (err) { setError(err.response?.data?.message || 'The verification code is invalid.'); }
    finally { setBusy(false); }
  };
  const submitProfile = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await saveProfile(profile); navigate(safeNext); }
    catch (err) { setError(err.response?.data?.message || 'Could not save your profile.'); }
    finally { setBusy(false); }
  };

  return <PublicLayout><div className="legacy-shell"><div className="home-container-pc mt-5"><div className="card-pc auth-card">
    <h2>{step === 'email' ? 'Continue with email' : step === 'otp' ? 'Enter verification code' : 'Complete your profile'}</h2>
    {error && <p className="error-message" role="alert">{error}</p>}
    {step === 'email' && <form onSubmit={submitEmail}><input className="pc-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required /><button className="pc-btn-create" disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button></form>}
    {step === 'otp' && <form onSubmit={submitOtp}><p>We sent a six-digit code to {email}.</p><input className="pc-input otp-input" inputMode="numeric" maxLength="6" pattern="[0-9]{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /><button className="pc-btn-create" disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button><button type="button" className="pc-btn-join" disabled={resendSeconds > 0 || busy} onClick={submitEmail}>{resendSeconds ? `Resend in ${resendSeconds}s` : 'Resend code'}</button><button type="button" className="pc-btn-join" onClick={() => setStep('email')}>Use another email</button></form>}
    {step === 'profile' && <form onSubmit={submitProfile}><input className="pc-input" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} placeholder="First name" required /><input className="pc-input" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} placeholder="Last name" required /><div className="avatar-picker" aria-label="Choose an avatar">{AVATARS.map(([key, glyph]) => <button type="button" key={key} className={`avatar-choice ${profile.avatar_key === key ? 'selected' : ''}`} onClick={() => setProfile({ ...profile, avatar_key: key })} aria-label={`Avatar ${key}`}>{glyph}</button>)}</div><button className="pc-btn-create" disabled={busy}>Finish setup</button></form>}
  </div></div></div></PublicLayout>;
};
export default AuthPage;
