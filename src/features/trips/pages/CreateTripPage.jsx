import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import GuestFields from '../../../shared/components/GuestFields';
import '../../../styles/CardStyles.css';
import '../../../styles/legacyShell.css';
import { createTrip } from '../api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';

const CURRENCIES = ['SAR', 'USD', 'EUR', 'GBP', 'AED', 'QAR', 'KWD', 'BHD', 'OMR'];

const CreateTripPage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  // Set when arriving via AuthPage's "Continue as guest" -> Guest Profile
  // Setup step (display_name + avatar_type/... in the same shape saveProfile
  // sends) — when present, the guest's name/avatar are already decided and
  // GuestFields is skipped entirely, matching "no redirect to Home in
  // between" for the guest continuation flow.
  const guestProfile = useLocation().state?.guestProfile || null;
  const [form, setForm] = useState({ title: '', budget: '', currency: user?.preferred_currency || 'SAR', password: '', guest_name: guestProfile?.display_name || '', avatar_key: 'avatar_01' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, budget: form.budget.replace(/,/g, '') };
      if (user) {
        delete payload.guest_name; delete payload.avatar_key;
      } else if (guestProfile) {
        const { display_name, ...avatarFields } = guestProfile;
        Object.assign(payload, avatarFields, { guest_name: display_name });
        delete payload.avatar_key;
      }
      const result = await createTrip(payload);
      navigate(`/trip/${result.trip.id}`);
    } catch (err) { setError(err.response?.data?.message || t('set.Error')); }
    finally { setLoading(false); }
  };

  return (
    <PublicLayout>
      <div className="legacy-shell">
        <h1 className="legacy-shell__page-title text-headline">{t('home.hero.createTrip')}</h1>
        <div className="home-container-pc mt-5">
          {loading || authLoading ? <NeoLoading /> : (
            <div className="card-pc create-trip-card">
              <h2>{t('create.new.trip')}</h2>
              <form onSubmit={submit}>
                <input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('Trip.title')} required />
                <input className="pc-input" type="number" min="0.01" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder={t('Budget')} required />
                <select className="pc-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {CURRENCIES.map((item) => <option key={item}>{item}</option>)}
                </select>
                <input className="pc-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t('createTrip.passwordPlaceholder')} />
                {!user && !guestProfile && <GuestFields values={form} onChange={setForm} namePlaceholder={t('guest.displayNamePlaceholder')} />}
                <button className="pc-btn-create">{t('create.trip.button')}</button>
              </form>
              {error && <div className="error-message" role="alert">{error}</div>}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default CreateTripPage;
