import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from '../../auth/components/Spinner';
import AvatarPreview from '../components/AvatarPreview';
import AvatarModeTabs from '../components/AvatarModeTabs';
import InitialsAvatarOptions from '../components/InitialsAvatarOptions';
import AvatarCategoryTabs from '../components/AvatarCategoryTabs';
import AvatarPickerGrid from '../components/AvatarPickerGrid';
import AnimationControl from '../components/AnimationControl';
import { DEFAULT_AVATAR_COLOR_ID } from '../data/avatarColors';
import { stylesForCategory, isAnimationCapable } from '../data/avatarCatalog';
import { createSeed } from '../services/avatarGenerator';
import { encodeInitialsKey, encodeDicebearKey } from '../utils/avatarKey';
import '../styles/profileSetup.css';

const MAX_DISPLAY_NAME_LENGTH = 60;
const BATCH_SIZE = 12;

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const generateBatch = (category) => {
  const candidates = stylesForCategory(category);
  return Array.from({ length: BATCH_SIZE }, () => ({ style: randomFrom(candidates).id, seed: createSeed() }));
};

/*
  Standalone full-page onboarding card (same pattern as OtpStep.jsx) —
  rendered by AuthPage.jsx in place of the whole page when step ===
  'profile', not nested in the Email/OTP two-column shell. Matches the
  approved Stitch desktop/mobile Complete-Profile references — the
  DiceBear-backed avatar picker replaces only the INITIALS/AVATARS
  selection engine underneath, not the surrounding card layout.

  avatar_key stays a single string on the wire — see utils/avatarKey.js
  for the "initials_*" / "dicebear_*" encoding this builds.
*/
const ProfileSetupPage = ({ busy, errorKey, onSubmit }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [mode, setMode] = useState('initials');
  const [colorId, setColorId] = useState(DEFAULT_AVATAR_COLOR_ID);
  const [category, setCategory] = useState('all');
  const [batch, setBatch] = useState(() => generateBatch('all'));
  const [selected, setSelected] = useState(() => ({ style: batch[0].style, seed: batch[0].seed }));
  const [animation, setAnimation] = useState('none');
  const [fieldErrorKey, setFieldErrorKey] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setBatch(generateBatch(category)); }, [category]);

  useEffect(() => {
    if (!isAnimationCapable(selected.style) && animation !== 'none') setAnimation('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.style]);

  const avatarKey = mode === 'initials'
    ? encodeInitialsKey(colorId)
    : encodeDicebearKey({ style: selected.style, seed: selected.seed, animation });

  const handleShuffle = () => setBatch(generateBatch(category));
  const handleSelect = (style, seed) => setSelected({ style, seed });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setFieldErrorKey('profile.setup.errors.displayNameRequired');
      return;
    }
    if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
      setFieldErrorKey('profile.setup.errors.displayNameInvalid');
      return;
    }
    setFieldErrorKey(null);
    onSubmit({ display_name: trimmed, avatar_key: avatarKey });
  };

  const visibleErrorKey = fieldErrorKey || errorKey;

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-card">
        <header className="profile-setup-card__header">
          <span className="profile-setup-card__brand text-label">{t('profile.setup.brand')}</span>
          <h1 className="profile-setup-card__heading text-display">{t('profile.setup.title')}</h1>
          <p className="profile-setup-card__description text-copy-lg">{t('profile.setup.description')}</p>
        </header>
        <form className="profile-setup-form" onSubmit={handleSubmit} noValidate>
          <div className="pf-field">
            <label className="pf-field__label text-label" htmlFor="profile-display-name">
              {t('profile.setup.displayName')}
            </label>
            <input
              id="profile-display-name"
              className="pf-field__input text-copy-lg"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('profile.setup.displayNamePlaceholder')}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              autoComplete="name"
              required
            />
          </div>

          <section className="pf-avatar-section">
            <h2 className="pf-avatar-section__legend text-label">{t('profile.setup.avatarAppearance')}</h2>
            <AvatarPreview avatarKey={avatarKey} displayName={displayName} />
            <AvatarModeTabs mode={mode} onChange={setMode} />
            {mode === 'initials' ? (
              <InitialsAvatarOptions colorId={colorId} onChange={setColorId} />
            ) : (
              <>
                <p className="pf-swatches__helper text-copy-sm">{t('profile.setup.avatarsHelper')}</p>
                <AvatarCategoryTabs category={category} onChange={setCategory} />
                <AvatarPickerGrid
                  batch={batch}
                  selectedStyle={selected.style}
                  selectedSeed={selected.seed}
                  onSelect={handleSelect}
                  onShuffle={handleShuffle}
                />
                {isAnimationCapable(selected.style) && (
                  <AnimationControl value={animation} onChange={setAnimation} />
                )}
              </>
            )}
          </section>

          {visibleErrorKey && <p className="auth-error" role="alert">{t(visibleErrorKey)}</p>}

          <button type="submit" className={`auth-btn auth-btn--primary${busy ? ' auth-btn--loading' : ''}`} disabled={busy}>
            {busy ? (
              <>
                <Spinner />
                <span>{t('profile.setup.saving')}</span>
              </>
            ) : (
              <span>{t('profile.setup.finish')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
