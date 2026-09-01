import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/Layout/PublicLayout';
import '../styles/CardStyles.css';
import '../styles/legacyShell.css';
import { isRequestCancelled } from '../api/errors';
import { cancelJoinRequest, getJoinRequestStatus } from '../features/governance/api/governanceApi';

export const requestTokenKey = (requestId) => `tripsplit:join-request:${requestId}`;

const JoinRequestPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [request, setRequest] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    let controller = null;
    const poll = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const result = await getJoinRequestStatus(requestId, sessionStorage.getItem(requestTokenKey(requestId)), { signal: controller.signal });
        setRequest(result);
        if (result.status === 'accepted') { sessionStorage.removeItem(requestTokenKey(requestId)); navigate(`/trips/${result.trip.short_code}/overview`); }
      } catch (err) { if (!isRequestCancelled(err)) setError(err.response?.data?.message || err.message || t('joinRequest.error')); }
    };
    poll();
    const timer = window.setInterval(poll, 12000);
    return () => { window.clearInterval(timer); controller?.abort(); };
  }, [requestId, navigate, t]);
  const cancel = async () => { await cancelJoinRequest(requestId, sessionStorage.getItem(requestTokenKey(requestId))); sessionStorage.removeItem(requestTokenKey(requestId)); navigate('/'); };
  return <PublicLayout><div className="legacy-shell"><main className="home-container-pc mt-5"><section className="card-pc"><h2>{t('joinRequest.sent')}</h2>{error && <p className="error-message" role="alert">{error}</p>}{request && <><h3>{request.trip.title}</h3><p>{request.banned ? t('joinRequest.banned') : request.status === 'rejected' ? t('joinRequest.rejected') : t('joinRequest.waiting')}</p><small>{new Date(request.requested_at).toLocaleString()}</small>{request.status === 'pending' && <button className="pc-btn-danger" onClick={cancel}>{t('joinRequest.cancel')}</button>}</>}</section></main></div></PublicLayout>;
};

export default JoinRequestPage;
