import React from 'react';
import { useTranslation } from 'react-i18next';
import './sectionLoading.css';

/*
  The section/card-level counterpart to NeoLoading -- NeoLoading stays
  reserved for genuinely page-blocking states (app/auth bootstrap,
  Suspense route-chunk loading, TripLayout's own first-ever trip fetch,
  a catastrophic no-context error) where nothing on the page can safely
  render yet. Everywhere else -- an ordinary page's own data fetch,
  once its static shell (title, header actions, section frames) is
  already known and rendered -- this renders INSIDE the still-visible
  shell instead of replacing it, so the user always sees where they
  are and what's coming, never a blank page.

  `minHeight` reserves layout space up front (a money/summary card
  should never collapse to nothing and then jump to its real height
  once data arrives) -- pass the real card's approximate resting
  height where one is known; the default (96px) suits a typical
  compact card body.
*/
const SectionLoading = ({ minHeight = 96, label, compact = false }) => {
  const { t } = useTranslation();
  return (
    <div
      className={`section-loading${compact ? ' section-loading--compact' : ''}`}
      style={{ minBlockSize: minHeight }}
      role="status"
      aria-live="polite"
    >
      <div className="section-loading__track"><div className="section-loading__bar" /></div>
      {!compact && <p className="section-loading__label text-label">{label || t('common.loading')}</p>}
    </div>
  );
};

export default SectionLoading;
