import React from 'react';
import { useTranslation } from 'react-i18next';

/*
  A compact squared Neo-classic badge (per the approved Stitch
  screenshot), not a circular donut chart. The actual shared/personal
  ratio is carried by the two legend rows below (server-computed
  percentages, never recalculated here) -- this graphic is the same
  "TOTAL 100%" motif Stitch uses, not a second visual encoding of the
  split, so it renders identically regardless of the real percentages.

  "100%" only means something once there's spending to classify --
  `hasSpending` is a presence check on the server's own totals (not a
  percentage/ratio calculation), the same pattern OverviewSummaryCards
  already uses for its positive/negative balance check. With nothing
  spent yet, the badge would otherwise misleadingly claim 100% of zero.
*/
const SpendingSplit = ({ split }) => {
  const { t } = useTranslation();
  const hasSpending = Number(split.shared) > 0 || Number(split.personal) > 0;

  return (
    <section className="ov-panel ov-panel--split">
      <header className="ov-panel__head">
        <h3 className="ov-panel__title text-headline-sm">{t('dashboard.overview.spendingSplit')}</h3>
      </header>
      <div className="ov-split__body">
        <p className="ov-split__help text-copy-sm">{t('dashboard.overview.spendingSplitHelp')}</p>

        {hasSpending ? (
          <div className="ov-split__frame">
            <div className="ov-split__frame-inner">
              <span className="ov-split__frame-label">{t('dashboard.overview.total')}</span>
              <bdi dir="ltr" className="ov-split__frame-value money--display">100%</bdi>
            </div>
          </div>
        ) : (
          <div className="ov-split__frame ov-split__frame--empty">
            <i className="bi bi-slash-circle" aria-hidden="true" />
            <span className="ov-split__frame-empty-label">{t('dashboard.overview.noSpendingYet')}</span>
          </div>
        )}

        <div className="ov-split__legend">
          <div className="ov-split__legend-row" title={t('dashboard.overview.sharedDescription')}>
            <span className="ov-split__swatch ov-split__swatch--shared" aria-hidden="true" />
            <span className="ov-split__legend-label">{t('dashboard.overview.shared')}</span>
            <bdi dir="ltr" className="ov-split__legend-value money--display">{split.shared_percent}%</bdi>
          </div>
          <div className="ov-split__legend-row" title={t('dashboard.overview.personalDescription')}>
            <span className="ov-split__swatch ov-split__swatch--personal" aria-hidden="true" />
            <span className="ov-split__legend-label">{t('dashboard.overview.personal')}</span>
            <bdi dir="ltr" className="ov-split__legend-value money--display">{split.personal_percent}%</bdi>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpendingSplit;
