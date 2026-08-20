import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Summary from '../components/Summary';
import Loading from '../../../components/Loading';
import ErrorState from '../../../shared/components/ErrorState';
import useRouteResource from '../../../shared/hooks/useRouteResource';
import { getTripSummary } from '../api/tripsApi';
import { getBalances } from '../../balances/api/balancesApi';
import { getFund } from '../../funds/api/fundsApi';

export default function TripOverviewPage() {
  const { trip, tripId } = useOutletContext();
  const { t } = useTranslation();
  const resource = useRouteResource(async (signal) => {
    const [summary, balances, fund] = await Promise.all([
      getTripSummary(tripId, { signal }), getBalances(tripId, { signal }), getFund(tripId, { signal }),
    ]);
    return { summary, balances, fund };
  }, [tripId]);
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.retry} />;
  return <section className="card-pc"><Summary budget={trip.budget} expenses={[]} currency={trip.currency} /><div className="summary-grid"><p>{t('summary.shared')}: {resource.data.summary.shared_spending} {trip.currency}</p><p>{t('summary.personal')}: {resource.data.summary.personal_spending} {trip.currency}</p><p>{t('summary.balance')}: {resource.data.summary.current_member?.balance} {trip.currency}</p>{resource.data.fund && <p>{t('summary.fund')}: {resource.data.fund.accounting.balance} {trip.currency}</p>}</div></section>;
}
