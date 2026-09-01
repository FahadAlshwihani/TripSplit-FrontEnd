import React from 'react';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
  { id: 'general', icon: 'edit_document', key: 'settings.quickJump.general' },
  { id: 'access', icon: 'lock', key: 'settings.quickJump.access' },
  { id: 'settlements', icon: 'sync_alt', key: 'settings.quickJump.settlements' },
];

/*
  Anchor-scroll only -- never a route change. Works identically in
  RTL/LTR since it only calls scrollIntoView on a same-page element;
  no coordinate math of its own.
*/
export default function SettingsQuickJump() {
  const { t } = useTranslation();
  const jumpTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <nav className="set-quickjump-card" aria-label={t('settings.quickJump.title')}>
      <h3 className="set-quickjump-card__title">{t('settings.quickJump.title')}</h3>
      <ul className="set-quickjump-card__list">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button type="button" className="set-quickjump-card__link" onClick={() => jumpTo(section.id)}>
              <span className="material-symbols-outlined" aria-hidden="true">{section.icon}</span>
              {t(section.key)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
