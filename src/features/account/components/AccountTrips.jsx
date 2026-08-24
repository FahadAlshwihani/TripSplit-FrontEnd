import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingButton from '../../../shared/components/LoadingButton';
import NeoLoading from '../../../shared/components/NeoLoading';
import useAccountTrips from '../hooks/useAccountTrips';
import AccountTripFilters from './AccountTripFilters';
import AccountTripRow from './AccountTripRow';

// A failure here (or in the filters/list) never blanks the rest of the
// Account page -- this section owns its own loading/error/empty states
// and renders inside its own <section>, isolated from AccountIdentity/
// AccountPreferences/AccountNotifications above it.
const AccountTrips = () => {
  const { t } = useTranslation();
  const [filterValue, setFilterValue] = useState('all');
  const { trips, hasMore, loading, loadingMore, error, retry, loadNextPage } = useAccountTrips(filterValue);

  return (
    <section className="acc-card acc-trips">
      <div className="acc-card__header-row">
        <h2 className="acc-card__title text-headline-sm">{t('account.trips.title')}</h2>
        <AccountTripFilters value={filterValue} onChange={setFilterValue} />
      </div>

      {loading ? (
        <NeoLoading />
      ) : error ? (
        <div className="acc-trips__error">
          <p className="acc-error" role="alert">{t('account.errors.tripsLoadFailed')}</p>
          <button type="button" className="acc-btn" onClick={retry}>{t('account.errors.retry')}</button>
        </div>
      ) : trips.length === 0 ? (
        <p className="acc-trips__empty text-copy">{t('account.trips.empty')}</p>
      ) : (
        <>
          <div className="acc-trips__list">
            {trips.map((trip) => (
              <AccountTripRow key={trip.id} trip={trip} onChanged={retry} />
            ))}
          </div>
          {hasMore && (
            <LoadingButton type="button" className="acc-btn" loading={loadingMore} loadingLabel={t('account.trips.loadingMore')} onClick={loadNextPage}>
              {t('account.trips.loadMore')}
            </LoadingButton>
          )}
        </>
      )}
    </section>
  );
};

export default AccountTrips;
