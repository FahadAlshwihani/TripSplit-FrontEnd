import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { claimGuestMemberships } from '../api/authApi';
import { getGuestToken, clearGuestToken } from '../../../api/credentials';
import { listGuestTrips, removeGuestTrip } from '../../../shared/guestTripsStore';
import LoadingButton from '../../../shared/components/LoadingButton';

/*
  Mounted on the authenticated Dashboard landing page. Reads the local
  guest-trip index (shared/guestTripsStore.js) purely to know WHICH trips
  to ask about -- the actual proof of ownership is each trip's real
  server-issued guest token (api/credentials.js), independently
  re-verified server-side by the claim endpoint. Every claimed/rejected/
  already-a-member trip has its local credential and index entry cleaned
  up regardless of outcome, since none of them remain useful afterwards;
  a request that fails outright (network/5xx) leaves everything local
  untouched so a retry still has what it needs.
*/
const ClaimGuestTripsBanner = () => {
  const { t } = useTranslation();
  const [eligible, setEligible] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    setEligible(
      listGuestTrips()
        .map((entry) => ({ ...entry, token: getGuestToken(entry.trip_id) }))
        .filter((entry) => entry.token)
    );
  }, []);

  const claim = async () => {
    if (claiming || eligible.length === 0) return;
    setClaiming(true);
    setErrorKey(null);
    try {
      const { results } = await claimGuestMemberships(
        eligible.map((entry) => ({ trip_public_id: entry.trip_id, guest_token: entry.token }))
      );
      results.forEach((result) => {
        clearGuestToken(result.trip_public_id);
        removeGuestTrip(result.trip_public_id);
      });
      setEligible([]);
    } catch {
      setErrorKey('claim.errors.failed');
    } finally {
      setClaiming(false);
    }
  };

  if (dismissed || eligible.length === 0) return null;

  return (
    <div className="card-pc claim-banner" role="status">
      <strong className="claim-banner__title">{t('claim.title')}</strong>
      <p>{t('claim.foundNotice')} {t('claim.prompt')}</p>
      {errorKey && <p className="auth-error" role="alert">{t(errorKey)}</p>}
      <div className="claim-banner__actions">
        <button type="button" className="pc-btn-join" onClick={() => setDismissed(true)} disabled={claiming}>
          {t('common.cancel')}
        </button>
        <LoadingButton type="button" className="pc-btn-create" onClick={claim} loading={claiming} loadingLabel={t('claim.claiming')}>
          {t('claim.action')}
        </LoadingButton>
      </div>
    </div>
  );
};

export default ClaimGuestTripsBanner;
