import React from 'react';
import { useTranslation } from 'react-i18next';
import SettlementTimelineEntry from './SettlementTimelineEntry';

/*
  Stitch source (SETTLEMENT LEDGER section): the permanent history --
  every status (pending/confirmed/rejected/cancelled), newest first,
  exactly as GET /trips/{id}/settlements/ already returns it (no
  status filter applied here -- every status stays visible). Each entry
  is a single self-contained column (40px status icon "tab" attached to
  its own card's top edge) -- identical on desktop and mobile, no
  alternating-sides/center-line layout, since that construction kept
  destabilizing against the 7/12 workspace column boundary (see
  settlements.css's own comment on .settle-timeline). Load More follows
  the same DRF page-URL pagination the page already used before this
  rebuild -- never silently stuck on page one.
*/
export default function SettlementLedgerCard({ settlements, currency, onOpen, hasMore, onLoadMore, loadingMore }) {
  const { t } = useTranslation();

  return (
    <section className="settle-card">
      <span className="settle-card__label">{t('settlements.settlementLedger')}</span>
      <div className="settle-card__body">
        {settlements.length > 0 ? (
          <>
            <ul className="settle-timeline">
              {settlements.map((settlement) => (
                <SettlementTimelineEntry key={settlement.id} settlement={settlement} currency={currency} onOpen={onOpen} />
              ))}
            </ul>
            {hasMore && (
              <div className="settle-ledger-loadmore">
                <button type="button" className="dash-btn dash-btn--secondary" onClick={onLoadMore} disabled={loadingMore}>
                  {t('common.loadMore')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="settle-card-empty">
            <p className="settle-card-empty__title">{t('settlements.empty')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
