import React from 'react';
import { useTranslation } from 'react-i18next';

/*
  A compact squared Neo-classic badge (per the approved Stitch
  screenshot), not a circular donut chart. The actual shared/personal
  ratio is carried by the two legend rows below (server-computed
  percentages, never recalculated here) -- this graphic is the same
  "TOTAL 100%" motif Stitch uses, not a second visual encoding of the
  split, so it renders identically regardless of the real percentages.
*/
const SpendingSplit = ({ split }) => {
  const { t } = useTranslation();

  return (
    <section className="ov-panel ov-panel--split">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">{t('dashboard.overview.spendingSplit')}</h3>
      </header>
      <div className="ov-split__body">
        <div className="ov-split__frame">
          <div className="ov-split__frame-inner">
            <span className="ov-split__frame-label">{t('dashboard.overview.total')}</span>
            <span className="ov-split__frame-value">100%</span>
          </div>
        </div>
        <div className="ov-split__legend">
          <div className="ov-split__legend-row">
            <span className="ov-split__swatch ov-split__swatch--shared" aria-hidden="true" />
            <span className="ov-split__legend-label">{t('dashboard.overview.shared')}</span>
            <span className="ov-split__legend-value">{split.shared_percent}%</span>
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
