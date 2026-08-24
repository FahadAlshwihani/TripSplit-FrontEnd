import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import GuestFields from '../../../shared/components/GuestFields';
import LoadingButton from '../../../shared/components/LoadingButton';
import CurrencyPicker from '../../../shared/components/CurrencyPicker';
import { createTrip } from '../api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';
import '../styles/createTrip.css';

const JOIN_POLICIES = [
  { value: 'open', icon: 'bi-globe2' },
  { value: 'approval_required', icon: 'bi-shield-check' },
  { value: 'invite_only', icon: 'bi-envelope' },
];

/*
  Stitch CREATE TRIP rebuild — translated onto the existing token-driven
  CSS system (no Tailwind). Sections mirror the approved reference: Trip
  Overview / Financials / Access & Security. Backend is authoritative for
  validation; the two checks here (title required, end >= start) only
  save a round trip and match the approved copy exactly.
*/
const CreateTripPage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const guestProfile = location.state?.guestProfile || null;

  const [form, setForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
    currency: user?.preferred_currency || 'SAR',
    budget: '',
    join_policy: 'open',
    password: '',
    guest_name: guestProfile?.display_name || '',
    avatar_key: 'avatar_01',
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrorKey, setFieldErrorKey] = useState(null);
  const [serverError, setServerError] = useState('');

  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const cancel = () => navigate(user ? '/dashboard' : '/', { replace: false });

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;

    if (!form.title.trim()) {
      setFieldErrorKey('createTrip.errors.titleRequired');
      return;
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setFieldErrorKey('createTrip.errors.endBeforeStart');
      return;
    }
    setFieldErrorKey(null);
    setServerError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        currency: form.currency,
        budget: form.budget ? form.budget.replace(/,/g, '') : '0',
        join_policy: form.join_policy,
        password: form.password,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      };
      if (!user) {
        if (guestProfile) {
          const { display_name, ...avatarFields } = guestProfile;
          Object.assign(payload, avatarFields, { guest_name: display_name });
        } else {
          payload.guest_name = form.guest_name;
          payload.avatar_key = form.avatar_key;
        }
      }
      const result = await createTrip(payload);
      navigate(`/trips/${result.trip.id}/overview`);
    } catch (err) {
      setServerError(err.response?.data?.message || t('set.Error'));
    } finally {
      setLoading(false);
    }
  };

  const visibleErrorText = fieldErrorKey ? t(fieldErrorKey) : serverError;

  return (
    <PublicLayout>
      <div className="ct-page">
        <header className="ct-header">
          <button type="button" className="ct-back" onClick={cancel} aria-label={t('common.cancel')}>
            <i className="bi bi-arrow-left ct-back__icon" aria-hidden="true" />
          </button>
          <h1 className="ct-title text-display">{t('createTrip.pageTitle')}</h1>
        </header>

        <div className="ct-card">
          {authLoading ? (
            <NeoLoading />
          ) : (
            <form onSubmit={submit} noValidate>
              <section className="ct-section">
                <h2 className="ct-section__title text-title">
                  <i className="bi bi-airplane ct-section__icon" aria-hidden="true" />
                  {t('createTrip.section.overview')}
                </h2>
                <div className="ct-field">
                  <label className="ct-field__label text-label" htmlFor="ct-title">{t('Trip.title')}</label>
                  <div className="ct-field__control">
                    <i className="bi bi-pencil ct-field__icon" aria-hidden="true" />
                    <input
                      id="ct-title"
                      className="ct-field__input"
                      type="text"
                      value={form.title}
                      onChange={setField('title')}
                      placeholder={t('createTrip.namePlaceholder')}
                      maxLength={200}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="ct-field-row">
                  <div className="ct-field">
                    <label className="ct-field__label text-label" htmlFor="ct-start-date">{t('createTrip.startDate')}</label>
                    <div className="ct-field__control">
                      <i className="bi bi-calendar3 ct-field__icon" aria-hidden="true" />
                      <input
                        id="ct-start-date"
                        className="ct-field__input"
                        type="date"
                        value={form.start_date}
                        max={form.end_date || undefined}
                        onChange={setField('start_date')}
                      />
                    </div>
                  </div>
                  <div className="ct-field">
                    <label className="ct-field__label text-label" htmlFor="ct-end-date">{t('createTrip.endDate')}</label>
                    <div className="ct-field__control">
                      <i className="bi bi-calendar-event ct-field__icon" aria-hidden="true" />
                      <input
                        id="ct-end-date"
                        className="ct-field__input"
                        type="date"
                        value={form.end_date}
                        min={form.start_date || undefined}
                        onChange={setField('end_date')}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="ct-section">
                <h2 className="ct-section__title text-title">
                  <i className="bi bi-cash-stack ct-section__icon" aria-hidden="true" />
                  {t('createTrip.section.financials')}
                </h2>
                <div className="ct-field-row">
                  <div className="ct-field">
                    <label className="ct-field__label text-label" htmlFor="ct-currency">{t('createTrip.baseCurrency')}</label>
                    <CurrencyPicker
                      id="ct-currency"
                      value={form.currency}
                      onChange={(code) => setForm({ ...form, currency: code })}
                      label={t('createTrip.baseCurrency')}
                    />
                  </div>
                  <div className="ct-field">
                    <label className="ct-field__label text-label" htmlFor="ct-budget">{t('createTrip.budgetOptional')}</label>
                    <div className="ct-field__control">
                      <i className="bi bi-wallet2 ct-field__icon" aria-hidden="true" />
                      <input
                        id="ct-budget"
                        className="ct-field__input"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={form.budget}
                        onChange={setField('budget')}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="ct-section">
                <h2 className="ct-section__title text-title">
                  <i className="bi bi-shield-lock ct-section__icon" aria-hidden="true" />
                  {t('createTrip.section.access')}
                </h2>
                <div className="ct-field">
                  <span className="ct-field__label text-label" id="ct-join-policy-label">{t('trip.joinPolicy')}</span>
                  <div className="ct-segmented" role="group" aria-labelledby="ct-join-policy-label">
                    {JOIN_POLICIES.map((policy) => (
                      <label
                        key={policy.value}
                        className={`ct-segmented__option${form.join_policy === policy.value ? ' is-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="joinPolicy"
                          className="ct-segmented__input"
                          value={policy.value}
                          checked={form.join_policy === policy.value}
                          onChange={() => setForm({ ...form, join_policy: policy.value })}
                        />
                        <i className={`bi ${policy.icon}`} aria-hidden="true" />
                        <span className="text-copy-sm">{t(`joinPolicy.${policy.value}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="ct-field">
                  <label className="ct-field__label text-label" htmlFor="ct-password">{t('createTrip.roomPasswordOptional')}</label>
                  <div className="ct-field__control">
                    <i className="bi bi-key ct-field__icon" aria-hidden="true" />
                    <input
                      id="ct-password"
                      className="ct-field__input"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={setField('password')}
                      placeholder="********"
                    />
                  </div>
                </div>
                {!user && !guestProfile && (
                  <GuestFields values={form} onChange={setForm} namePlaceholder={t('guest.displayNamePlaceholder')} />
                )}
              </section>

              {visibleErrorText && <p className="ct-error" role="alert">{visibleErrorText}</p>}

              <div className="ct-actions">
                <button type="button" className="ct-btn ct-btn--secondary" onClick={cancel}>
                  {t('common.cancel')}
                </button>
                <LoadingButton
                  className={`ct-btn ct-btn--primary${loading ? ' ct-btn--loading' : ''}`}
                  loading={loading}
                  loadingLabel={t('createTrip.creating')}
                >
                  <span>{t('createTrip.submit')}</span>
                  <i className="bi bi-arrow-right ct-submit__icon" aria-hidden="true" />
                </LoadingButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default CreateTripPage;
