import React from 'react';
import { useTranslation } from 'react-i18next';

const AvatarModeTabs = ({ mode, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-tabs" role="tablist" aria-label={t('profile.setup.avatarAppearance')}>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'initials'}
        className={`pf-tabs__tab text-label${mode === 'initials' ? ' is-active' : ''}`}
        onClick={() => onChange('initials')}
      >
        {t('profile.setup.initials')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'dicebear'}
        className={`pf-tabs__tab text-label${mode === 'dicebear' ? ' is-active' : ''}`}
        onClick={() => onChange('dicebear')}
      >
        {t('profile.setup.avatars')}
      </button>
    </div>
  );
};

export default AvatarModeTabs;
