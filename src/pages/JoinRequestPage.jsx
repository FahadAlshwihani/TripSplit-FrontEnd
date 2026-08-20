import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import { cancelJoinRequest, getJoinRequestStatus } from '../features/governance/api/governanceApi';

export const requestTokenKey = (requestId) => `tripsplit:join-request:${requestId}`;

const JoinRequestPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [request, setRequest] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const result = await getJoinRequestStatus(requestId, sessionStorage.getItem(requestTokenKey(requestId)));
        if (!active) return;
        setRequest(result);
        if (result.status === 'accepted') { sessionStorage.removeItem(requestTokenKey(requestId)); navigate(`/trip/${result.trip.public_id}`); }
      } catch (err) { if (active) setError(err.response?.data?.message || t('joinRequest.error')); }
    };
    poll();
    const timer = window.setInterval(poll, 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [requestId, navigate, t]);
  const cancel = async () => { await cancelJoinRequest(requestId, sessionStorage.getItem(requestTokenKey(requestId))); sessionStorage.removeItem(requestTokenKey(requestId)); navigate('/'); };
  return <MainLayout><main className="home-container-pc mt-5"><section className="card-pc"><h2>{t('joinRequest.sent')}</h2>{error && <p className="error-message" role="alert">{error}</p>}{request && <><h3>{request.trip.title}</h3><p>{request.status === 'rejected' ? t('joinRequest.rejected') : t('joinRequest.waiting')}</p><small>{new Date(request.requested_at).toLocaleString()}</small>{request.status === 'pending' && <button className="pc-btn-danger" onClick={cancel}>{t('joinRequest.cancel')}</button>}</>}</section></main></MainLayout>;
};

export default JoinRequestPage;
