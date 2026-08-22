import React from 'react';
import { useTranslation } from 'react-i18next';
import { ANIMATION_LEVELS } from '../utils/avatarKey';

// Only rendered by ProfileSetupPage when the selected style is
// animation-capable (see avatarCatalog.js) — DiceBear itself has no
// animation feature; this is a small TripSplit-authored CSS treatment
// (see profileSetup.css's .pf-avatar--anim-* rules) applied only to the
// large preview, never the picker grid, per the "keep the picker calm"
// guidance. See docs/AVATAR_SYSTEM.md for the full explanation.
const AnimationControl = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-animation" role="radiogroup" aria-label={t('profile.setup.animation')}>
      <span className="pf-animation__label text-label">{t('profile.setup.animation')}</span>
      <div className="pf-animation__options">
        {ANIMATION_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            className={`pf-animation__option text-label${value === level ? ' is-active' : ''}`}
            onClick={() => onChange(level)}
          >
            {t(`profile.setup.animationLevels.${level}`)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnimationControl;
