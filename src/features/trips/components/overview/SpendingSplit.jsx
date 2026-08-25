import React from 'react';
import { useTranslation } from 'react-i18next';

const SpendingSplit = ({ split }) => {
  const { t } = useTranslation();
  const sharedPercent = split.shared_percent;
  const gradient = `conic-gradient(var(--nc-indigo-700) 0% ${sharedPercent}%, var(--color-surface-container) ${sharedPercent}% 100%)`;

  return (
    <section className="ov-panel ov-panel--split">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">{t('dashboard.overview.spendingSplit')}</h3>
      </header>
      <div className="ov-split__body">
        <div className="ov-split__donut" style={{ background: gradient }}>
          <div className="ov-split__donut-hole">
            <span className="ov-split__donut-label">{t('dashboard.overview.total')}</span>
            <span className="ov-split__donut-value">100%</span>
          </div>
        </div>
        <div className="ov-split__legend">
          <div className="ov-split__legend-row">
            <span className="ov-split__swatch ov-split__swatch--shared" aria-hidden="true" />
            <span className="ov-split__legend-label">{t('dashboard.overview.shared')}</span>
            <span className="ov-split__legend-value">{sharedPercent}%</span>
          </div>
          <div className="ov-split__legend-row">
            <span className="ov-split__swatch ov-split__swatch--personal" aria-hidden="true" />
            <span className="ov-split__legend-label">{t('dashboard.overview.personal')}</span>
            <span className="ov-split__legend-value">{split.personal_percent}%</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpendingSplit;
