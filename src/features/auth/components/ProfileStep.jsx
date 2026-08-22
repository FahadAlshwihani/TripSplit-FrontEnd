import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AVATARS } from '../../../shared/utils/avatars';

const ProfileStep = ({ busy, error, onSubmit }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarKey, setAvatarKey] = useState('avatar_01');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ first_name: firstName, last_name: lastName, avatar_key: avatarKey });
  };

  return (
    <div className="auth-step">
      <div className="auth-step__head">
        <h1 className="auth-step__heading text-headline-md">{t('auth.profile.heading')}</h1>
        <p className="auth-step__description text-copy">{t('auth.profile.description')}</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-field__label text-label" htmlFor="auth-first-name">{t('auth.profile.firstName')}</label>
          <input id="auth-first-name" className="auth-field__input text-copy" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
        </div>
        <div className="auth-field">
          <label className="auth-field__label text-label" htmlFor="auth-last-name">{t('auth.profile.lastName')}</label>
          <input id="auth-last-name" className="auth-field__input text-copy" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </div>
        <div className="auth-field">
          <span className="auth-field__label text-label">{t('auth.profile.avatarLabel')}</span>
          <div className="auth-avatars" role="group" aria-label={t('auth.profile.avatarLabel')}>
            {AVATARS.map(([key, glyph]) => (
              <button
                type="button"
                key={key}
                className={`auth-avatars__choice${avatarKey === key ? ' is-selected' : ''}`}
                onClick={() => setAvatarKey(key)}
                aria-pressed={avatarKey === key}
                aria-label={key}
              >
                {glyph}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
          <span>{t('auth.profile.submit')}</span>
        </button>
      </form>
    </div>
  );
};

export default ProfileStep;
