import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import Loading from '../components/Loading';
import { createTrip, getTrips, joinTrip } from '../utils/api';
import { AVATARS, avatarGlyph } from '../utils/avatars';
import { useAuth } from '../auth/AuthContext';
import { requestTokenKey } from './JoinRequestPage';

const GuestFields = ({ values, onChange }) => <>
  <input className="pc-input" value={values.guest_name} onChange={(e) => onChange({ ...values, guest_name: e.target.value })} placeholder="Your display name" required />
  <div className="avatar-picker">{AVATARS.map(([key, glyph]) => <button type="button" key={key} className={`avatar-choice ${values.avatar_key === key ? 'selected' : ''}`} onClick={() => onChange({ ...values, avatar_key: key })}>{glyph}</button>)}</div>
</>;

const HomePage = () => {
  const { t } = useTranslation();
  const { user, authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [create, setCreate] = useState({ title: '', budget: '', currency: user?.preferred_currency || 'SAR', password: '', guest_name: '', avatar_key: 'avatar_01' });
  const [join, setJoin] = useState({ join_code: '', password: '', guest_name: '', avatar_key: 'avatar_02' });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (user) getTrips().then((result) => setTrips(result.results)); else setTrips([]); }, [user]);

  const submitCreate = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { const payload = { ...create, budget: create.budget.replace(/,/g, '') }; if (user) { delete payload.guest_name; delete payload.avatar_key; } const result = await createTrip(payload); navigate(`/trip/${result.trip.id}`); }
    catch (err) { setError(err.response?.data?.message || t('set.Error')); }
    finally { setLoading(false); }
  };
  const submitJoin = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try { const payload = { ...join }; if (user) { delete payload.guest_name; delete payload.avatar_key; } const result = await joinTrip(payload); if (result.join_request) { if (result.request_token) sessionStorage.setItem(requestTokenKey(result.join_request.id), result.request_token); navigate(`/join-request/${result.join_request.id}`); } else navigate(`/trip/${result.trip.id}`); }
    catch (err) { setError(err.response?.data?.message || t('show.Error.alert2')); }
    finally { setLoading(false); }
  };

  return <MainLayout><div className="home-container-pc mt-5">
    {loading || authLoading ? <Loading /> : <>
      <div className="card-pc account-card">{user ? <><p>Signed in as <strong>{user.first_name || user.email}</strong></p><div className="account-actions"><Link className="pc-btn-join" to="/profile">Profile</Link><button className="pc-btn-danger" onClick={logout}>Log out</button></div></> : <><p>Create and join trips as a guest, or keep a durable trip history.</p><Link className="pc-btn-join" to="/auth">Continue with email</Link></>}</div>
      <div className="card-pc create-trip-card"><h2>{t('create.new.trip')}</h2><form onSubmit={submitCreate}><input className="pc-input" value={create.title} onChange={(e) => setCreate({ ...create, title: e.target.value })} placeholder={t('Trip.title')} required /><input className="pc-input" type="number" min="0.01" step="0.01" value={create.budget} onChange={(e) => setCreate({ ...create, budget: e.target.value })} placeholder={t('Budget')} required /><select className="pc-input" value={create.currency} onChange={(e) => setCreate({ ...create, currency: e.target.value })}>{['SAR','USD','EUR','GBP','AED','QAR','KWD','BHD','OMR'].map((item) => <option key={item}>{item}</option>)}</select><input className="pc-input" type="password" value={create.password} onChange={(e) => setCreate({ ...create, password: e.target.value })} placeholder="Room password (optional)" />{!user && <GuestFields values={create} onChange={setCreate} />}<button className="pc-btn-create">{t('create.trip.button')}</button></form></div>
      <div className="card-pc join-trip-card"><h2>{t('join.existing.trip')}</h2><form onSubmit={submitJoin}><input className="pc-input" value={join.join_code} onChange={(e) => setJoin({ ...join, join_code: e.target.value.toUpperCase() })} placeholder={t('enter.trip.code')} required /><input className="pc-input" type="password" value={join.password} onChange={(e) => setJoin({ ...join, password: e.target.value })} placeholder="Room password (if required)" />{!user && <GuestFields values={join} onChange={setJoin} />}<button className="pc-btn-join">{t('join.trip.button')}</button></form></div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {user && trips.length > 0 && <div className="card-pc"><h2>{t('trip.history')}</h2><div className="expenses-list">{trips.map((trip) => <Link className="expense-item trip-history-item" key={trip.id} to={`/trip/${trip.id}`}><span className="member-avatar">{avatarGlyph(user.avatar_key)}</span><span><strong>{trip.title}</strong><br />{trip.currency} {trip.budget} · {t(trip.archived_at ? 'trip.archived' : 'trip.active')}</span></Link>)}</div></div>}
    </>}
  </div></MainLayout>;
};
export default HomePage;
