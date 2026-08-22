import React from 'react';
import { useTranslation } from 'react-i18next';
import { AVATAR_CATEGORIES } from '../data/avatarCatalog';

const AvatarCategoryTabs = ({ category, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-categories" role="tablist" aria-label={t('profile.setup.categories')}>
      {AVATAR_CATEGORIES.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={category === id}
          className={`pf-categories__chip text-label${category === id ? ' is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          {t(`profile.setup.categoryLabels.${id}`)}
        </button>
      ))}
    </div>
  );
};

export default AvatarCategoryTabs;
