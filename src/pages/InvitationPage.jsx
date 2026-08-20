import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import { acceptInvitation, getInvitation } from '../features/invitations/api/invitationsApi';
import { useAuth } from '../auth/AuthContext';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const [invite, setInvite] = useState(null), [name, setName] = useState(''), [avatar, setAvatar] = useState('avatar_01'), [error, setError] = useState(''), [accepting, setAccepting] = useState(false);
  useEffect(() => { getInvitation(token).then(setInvite).catch((err) => setError(err.response?.data?.message || t('invite.invalid'))); }, [token, t]);
  const accept = useCallback(async (payload) => { if (accepting) return; setAccepting(true); try { const result = await acceptInvitation(token, payload); navigate(`/trip/${result.trip.id}`); } catch (err) { setError(err.response?.data?.message || t('invite.invalid')); setAccepting(false); } }, [accepting, navigate, t, token]);
  useEffect(() => { if (invite?.valid && invite.email_required && user && !authLoading) accept({}); }, [invite, user, authLoading, accept]); // resumes after OTP/onboarding
  const submit = async (event) => { event.preventDefault(); accept({ guest_name: name, avatar_key: avatar }); };
  const login = () => navigate(`/auth?next=${encodeURIComponent(`/invite/${token}`)}`);
  return <MainLayout><main className="home-container-pc mt-5"><section className="card-pc"><h2>{t('invite.title')}</h2>{error && <div className="error-message" role="alert">{error}</div>}{invite && <form onSubmit={submit}><p>{t('invite.trip', { name: invite.trip_title })}</p>{!invite.valid ? <p>{t('invite.invalid')}</p> : invite.email_required ? (!user && !authLoading ? <button type="button" className="pc-btn-create" onClick={login}>{t('invite.continueEmail')}</button> : <p>{t('invite.accepting')}</p>) : <><label>{t('invite.name')}<input className="pc-input" value={name} onChange={(event) => setName(event.target.value)} required /></label><label>{t('invite.avatar')}<select className="pc-input" value={avatar} onChange={(event) => setAvatar(event.target.value)}>{Array.from({ length: 8 }, (_, index) => <option key={index} value={`avatar_0${index + 1}`}>{`Avatar ${index + 1}`}</option>)}</select></label><button className="pc-btn-create" disabled={accepting}>{t('invite.accept')}</button></>}</form>}</section></main></MainLayout>;
};

export default InvitationPage;
