import React from 'react';
import { useTranslation } from 'react-i18next';
import SettlementTimelineEntry from './SettlementTimelineEntry';

/*
  Stitch source (SETTLEMENT LEDGER section): the permanent history --
  every status (pending/confirmed/rejected/cancelled), newest first,
  exactly as GET /trips/{id}/settlements/ already returns it (no
  status filter applied here -- every status stays visible). Desktop
  renders Stitch's alternating vertical timeline (odd/even entries flip
  sides around a centered line); mobile collapses to one-sided
  (governed entirely by settlements.css's breakpoint, no JS branching
  needed). Load More follows the same DRF page-URL pagination the page
  already used before this rebuild -- never silently stuck on page one.
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
