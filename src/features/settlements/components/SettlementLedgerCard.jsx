import React from 'react';
import { useTranslation } from 'react-i18next';
import SettlementTimelineEntry from './SettlementTimelineEntry';

/*
  Stitch source (SETTLEMENT LEDGER section): the permanent history --
  every status (pending/confirmed/rejected/cancelled), newest first,
  exactly as GET /trips/{id}/settlements/ already returns it (no
  status filter applied here -- every status stays visible). A
  continuous chronology line runs down the Ledger card's own content
  region as a subtle background guide; each entry owns its own 40px
  status node, centered directly above its own card (never a shared
  left/center rail), and the whole entry (node + card together)
  alternates sides on desktop, collapsing to one-sided on mobile -- see
  settlements.css's own comment on .settle-timeline. Load More follows
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
