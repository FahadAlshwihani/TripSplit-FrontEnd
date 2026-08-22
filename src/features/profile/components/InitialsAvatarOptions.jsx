import React from 'react';
import { useTranslation } from 'react-i18next';
import { AVATAR_COLORS } from '../data/avatarColors';

const InitialsAvatarOptions = ({ colorId, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-swatches">
      <p className="pf-swatches__helper text-copy-sm">{t('profile.setup.initialsHelper')}</p>
      <span className="pf-swatches__label text-label">{t('profile.setup.backgroundColor')}</span>
      <div className="pf-swatches__row">
        {AVATAR_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className={`pf-swatch${colorId === color.id ? ' is-selected' : ''}`}
            style={{ background: color.token }}
            aria-label={t(color.labelKey)}
            aria-pressed={colorId === color.id}
            onClick={() => onChange(color.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default InitialsAvatarOptions;
