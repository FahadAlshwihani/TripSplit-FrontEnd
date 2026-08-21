import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import GuestFields from '../../../shared/components/GuestFields';
import '../../../styles/CardStyles.css';
import '../../../styles/legacyShell.css';
import { joinTrip } from '../api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';
import { requestTokenKey } from '../../../pages/JoinRequestPage';

const JoinTripPage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ join_code: '', password: '', guest_name: '', avatar_key: 'avatar_02' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (user) { delete payload.guest_name; delete payload.avatar_key; }
      const result = await joinTrip(payload);
      if (result.join_request) {
        if (result.request_token) sessionStorage.setItem(requestTokenKey(result.join_request.id), result.request_token);
        navigate(`/join-request/${result.join_request.id}`);
      } else {
        navigate(`/trip/${result.trip.id}`);
      }
    } catch (err) { setError(err.response?.data?.message || t('show.Error.alert2')); }
    finally { setLoading(false); }
  };

  return (
    <PublicLayout>
      <div className="legacy-shell">
        <h1 className="legacy-shell__page-title text-headline">{t('home.hero.joinTrip')}</h1>
        <div className="home-container-pc mt-5">
          {loading || authLoading ? <NeoLoading /> : (
            <div className="card-pc join-trip-card">
              <h2>{t('join.existing.trip')}</h2>
              <form onSubmit={submit}>
                <input className="pc-input" value={form.join_code} onChange={(e) => setForm({ ...form, join_code: e.target.value.toUpperCase() })} placeholder={t('enter.trip.code')} required />
                <input className="pc-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t('joinTrip.passwordPlaceholder')} />
                {!user && <GuestFields values={form} onChange={setForm} namePlaceholder={t('guest.displayNamePlaceholder')} />}
                <button className="pc-btn-join">{t('join.trip.button')}</button>
              </form>
              {error && <div className="error-message" role="alert">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default JoinTripPage;
