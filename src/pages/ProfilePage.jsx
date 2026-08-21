import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import '../styles/CardStyles.css';
import { useAuth } from '../auth/AuthContext';
import { AVATARS, avatarGlyph } from '../shared/utils/avatars';
import { requestEmailChange, verifyEmailChange } from '../features/auth/api/authApi';
import { getTrips } from '../features/trips/api/tripsApi';

const currencies = ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'QAR', 'KWD', 'BHD', 'OMR'];
const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, authLoading, saveProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [emailChange, setEmailChange] = useState({ email: '', otp_id: null, code: '' });
  const [trips, setTrips] = useState([]);
  useEffect(() => { if (user) setForm({ first_name: user.first_name, last_name: user.last_name, phone_number: user.phone_number || '', avatar_key: user.avatar_key, preferred_language: user.preferred_language, preferred_currency: user.preferred_currency }); }, [user]);
  useEffect(() => { if (user) getTrips().then((result) => setTrips(result.results)); }, [user]);
  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!form) return null;
  const tripGroups = { active: trips.filter((trip) => !trip.archived_at && trip.lifecycle_status !== 'closed'), closed: trips.filter((trip) => !trip.archived_at && trip.lifecycle_status === 'closed'), archived: trips.filter((trip) => trip.archived_at) };
  const save = async (event) => { event.preventDefault(); await saveProfile(form); setMessage('Profile saved.'); };
  const sendEmailCode = async () => { const result = await requestEmailChange(emailChange.email); setEmailChange({ ...emailChange, otp_id: result.otp_id }); setMessage('Verification code sent to the new email.'); };
  const confirmEmail = async () => { await verifyEmailChange({ otp_id: emailChange.otp_id, email: emailChange.email, code: emailChange.code }); window.location.reload(); };
  return <MainLayout><div className="home-container-pc mt-5"><div className="card-pc"><h2>Profile & Settings</h2><p>{user.email}</p><form onSubmit={save}><input className="pc-input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" required /><input className="pc-input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" required /><input className="pc-input" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="Phone number (optional)" /><select className="pc-input" value={form.preferred_language} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}><option value="en">English</option><option value="ar">العربية</option></select><select className="pc-input" value={form.preferred_currency} onChange={(e) => setForm({ ...form, preferred_currency: e.target.value })}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select><div className="avatar-picker">{AVATARS.map(([key, glyph]) => <button type="button" key={key} className={`avatar-choice ${form.avatar_key === key ? 'selected' : ''}`} onClick={() => setForm({ ...form, avatar_key: key })}>{glyph}</button>)}</div>{message && <p className="success-message">{message}</p>}<button className="pc-btn-create">Save profile</button></form><hr /><h3>Change email</h3><input className="pc-input" type="email" value={emailChange.email} onChange={(e) => setEmailChange({ ...emailChange, email: e.target.value })} placeholder="New email" />{!emailChange.otp_id ? <button className="pc-btn-join" onClick={sendEmailCode}>Send verification code</button> : <><input className="pc-input otp-input" value={emailChange.code} onChange={(e) => setEmailChange({ ...emailChange, code: e.target.value.replace(/\D/g, '') })} maxLength="6" placeholder="Six-digit code" /><button className="pc-btn-join" onClick={confirmEmail}>Confirm new email</button></>}</div>
    <div className="card-pc"><h2>{t('trip.history')}</h2>{Object.entries(tripGroups).map(([status, rows]) => <section key={status}><h3>{t(`trip.group.${status}`)}</h3>{rows.length ? <div className="expenses-list">{rows.map((trip) => <Link className="expense-item trip-history-item" key={trip.id} to={`/trip/${trip.id}`}><span className="member-avatar">{avatarGlyph(user.avatar_key)}</span><span><strong>{trip.title}</strong><br />{trip.currency} {trip.budget} · {trip.member_count} {t('members.title')} · {t('dashboard.yourBalance')} {trip.current_balance}<br /><small>{trip.last_activity_at ? new Date(trip.last_activity_at).toLocaleDateString() : '—'}</small></span></Link>)}</div> : <p>{t(`trip.empty.${status}`)}</p>}</section>)}</div>
  </div></MainLayout>;
};
export default ProfilePage;
