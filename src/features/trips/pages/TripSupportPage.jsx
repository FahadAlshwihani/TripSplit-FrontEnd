import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/overview.css';

/*
  Deliberately minimal -- Support content itself is explicitly out of
  scope for this task (shell-first), this only makes the canonical
  /trips/:id/support route/nav destination real instead of a dead link.
*/
export default function TripSupportPage() {
  const { t } = useTranslation();
  return (
    <section className="ov-panel">
      <header className="ov-panel__head"><h1 className="ov-panel__title text-headline-sm">{t('dashboard.nav.support')}</h1></header>
      <div className="ov-panel__body">
        <p className="text-copy">{t('dashboard.support.body')}</p>
        <a className="ov-link" href="mailto:support@tripsplit.app">support@tripsplit.app</a>
      </div>
    </section>
  );
}
