import React from 'react';
import { useTranslation } from 'react-i18next';
import useDicebearAvatar from '../hooks/useDicebearAvatar';
import { getAvatarStyle } from '../data/avatarCatalog';

// One candidate cell — its own hook instance, so each cell loads/renders
// independently (a slow style chunk for one cell never blocks the others).
const AvatarPickerItem = ({ style, seed, selected, onSelect }) => {
  const { t } = useTranslation();
  const { status, dataUri } = useDicebearAvatar({ style, seed, size: 128 });
  const styleEntry = getAvatarStyle(style);
  const label = t('profile.setup.avatarOption', { style: styleEntry?.label || style });

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={label}
      className={`pf-picker-grid__item${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(style, seed)}
      disabled={status === 'error'}
    >
      {status === 'ready' && <img src={dataUri} alt="" />}
      {status !== 'ready' && <span className="pf-picker-grid__placeholder" aria-hidden="true" />}
    </button>
  );
};

// Rendered entirely from the `batch` prop (candidate {style, seed} pairs
// the parent generates — see ProfileSetupPage.jsx) — this component never
// invents avatars of its own, it only displays and lets the user pick
// from what it's given, plus the Shuffle affordance to ask for a new set.
const AvatarPickerGrid = ({ batch, selectedStyle, selectedSeed, onSelect, onShuffle }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-picker">
      <div className="pf-picker-grid" role="listbox" aria-label={t('profile.setup.avatars')}>
        {batch.map(({ style, seed }) => (
          <AvatarPickerItem
            key={`${style}-${seed}`}
            style={style}
            seed={seed}
            selected={selectedStyle === style && selectedSeed === seed}
            onSelect={onSelect}
          />
        ))}
      </div>
      <button type="button" className="pf-picker__shuffle text-label" onClick={onShuffle}>
        {t('profile.setup.shuffle')}
      </button>
    </div>
  );
};

export default AvatarPickerGrid;
