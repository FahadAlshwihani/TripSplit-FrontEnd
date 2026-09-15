import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../components/Layout/PublicLayout';
import LoadingButton from '../shared/components/LoadingButton';
import '../features/join/styles/joinRequest.css';
import { isRequestCancelled } from '../api/errors';
import { cancelJoinRequest, getJoinRequestStatus } from '../features/governance/api/governanceApi';

export const requestTokenKey = (requestId) => `tripsplit:join-request:${requestId}`;

const StatusIcon = ({ state }) => {
  if (state === 'approved') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 25.5 20 34l17-20" /></svg>;
  if (state === 'rejected') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m15 15 18 18M33 15 15 33" /></svg>;
  if (state === 'banned' || state === 'error') return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7 42 39H6L24 7Z" /><path d="M24 18v10M24 33v1" /></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7h20M14 41h20M16 8c0 8 3 11 8 16-5 5-8 8-8 16M32 8c0 8-3 11-8 16 5 5 8 8 8 16" /></svg>;
};

const BackIcon = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17 10H4m5-5-5 5 5 5" /></svg>;
const RefreshIcon = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 7a7 7 0 1 0 1 6M16 3v4h-4" /></svg>;

const JoinRequestPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [request, setRequest] = useState(null);
  const [errorKind, setErrorKind] = useState('');
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const controllerRef = useRef(null);
  const hasResultRef = useRef(false);

  const checkStatus = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setErrorKind('');
    if (hasResultRef.current) setRefreshing(true);
    else setChecking(true);
    try {
      const token = sessionStorage.getItem(requestTokenKey(requestId));
      const result = await getJoinRequestStatus(requestId, token, { signal: controller.signal });
      if (controller.signal.aborted) return;
      hasResultRef.current = true;
      setRequest(result);
      if (result.status === 'accepted') {
        sessionStorage.removeItem(requestTokenKey(requestId));
        navigate(`/trips/${result.trip.short_code}/overview`);
      }
    } catch (error) {
      if (isRequestCancelled(error)) return;
      if (error.status === 404 || error.response?.status === 404) setErrorKind('invalid');
      else if (error.status === 403 || error.response?.status === 403) setErrorKind('access');
      else setErrorKind('network');
    } finally {
      if (controllerRef.current === controller) {
        setChecking(false);
        setRefreshing(false);
      }
    }
  }, [navigate, requestId]);

  useEffect(() => {
    hasResultRef.current = false;
    setRequest(null);
    checkStatus();
    const timer = window.setInterval(checkStatus, 12000);
    return () => {
      window.clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [checkStatus]);

  const cancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setErrorKind('');
    try {
      await cancelJoinRequest(requestId, sessionStorage.getItem(requestTokenKey(requestId)));
      sessionStorage.removeItem(requestTokenKey(requestId));
      navigate('/');
    } catch (_error) {
      setErrorKind('network');
      setCancelling(false);
    }
  };

  const state = errorKind && !request ? 'error' : request?.banned ? 'banned' : request?.status === 'rejected' ? 'rejected' : request?.status === 'accepted' ? 'approved' : 'pending';
  const titleKey = state === 'approved' ? 'joinRequest.approvedTitle' : state === 'rejected' ? 'joinRequest.rejectedTitle' : state === 'banned' ? 'joinRequest.bannedTitle' : state === 'error' ? (errorKind === 'invalid' ? 'joinRequest.invalidTitle' : errorKind === 'access' ? 'joinRequest.accessTitle' : 'joinRequest.errorTitle') : 'joinRequest.pendingTitle';
  const bodyKey = state === 'approved' ? 'joinRequest.approvedBody' : state === 'rejected' ? 'joinRequest.rejectedBody' : state === 'banned' ? 'joinRequest.bannedBody' : state === 'error' ? (errorKind === 'invalid' ? 'joinRequest.invalidBody' : errorKind === 'access' ? 'joinRequest.accessBody' : 'joinRequest.errorBody') : 'joinRequest.pendingBody';

  return (
    <PublicLayout>
      <div className="join-request-page">
        <section className={`join-request-card join-request-card--${state}`} aria-labelledby="join-request-title" aria-busy={checking || refreshing}>
          <div className="join-request-card__accent" aria-hidden="true" />
          <header className="join-request-card__header">
            <span className="join-request-card__eyebrow text-label">{t('joinRequest.eyebrow')}</span>
            <div className="join-request-card__icon"><StatusIcon state={state} /></div>
            <h1 id="join-request-title" className="join-request-card__title text-headline-lg">{t(titleKey)}</h1>
            <p className="join-request-card__body text-copy" role="status" aria-live="polite" aria-atomic="true">
              {checking && !request ? t('joinRequest.checking') : t(bodyKey, { trip: request?.trip?.title || t('joinRequest.tripFallback') })}
            </p>
          </header>

          {request && (
            <div className="join-request-summary">
              <div className="join-request-summary__row"><span className="text-label">{t('joinRequest.tripLabel')}</span><strong className="text-copy">{request.trip.title}</strong></div>
              <div className="join-request-summary__row">
                <span className="text-label">{t('joinRequest.statusLabel')}</span>
                <span className={`join-request-status join-request-status--${state} text-label`}>
                  {state === 'rejected' ? t('joinRequest.rejected') : state === 'banned' ? t('joinRequest.banned') : state === 'approved' ? t('joinRequest.approvedTitle') : t('joinRequest.waiting')}
                </span>
              </div>
              {request.requested_at && (
                <div className="join-request-summary__row">
                  <span className="text-label">{t('joinRequest.requestedAt')}</span>
                  <time className="text-copy-sm" dir="ltr" dateTime={request.requested_at}>{new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.requested_at))}</time>
                </div>
              )}
            </div>
          )}

          {state === 'pending' && request && <p className="join-request-card__note text-copy-sm">{t('joinRequest.noAction')}</p>}
          {errorKind && request && <p className="join-request-card__inline-error text-copy-sm" role="alert">{t('joinRequest.errorBody')}</p>}

          <footer className="join-request-actions">
            {(state === 'pending' || state === 'error') && (
              <LoadingButton type="button" className="join-request-button join-request-button--primary" onClick={checkStatus} loading={refreshing || (checking && !request)} loadingLabel={t('joinRequest.refreshing')}>
                <RefreshIcon /><span>{t('joinRequest.refresh')}</span>
              </LoadingButton>
            )}
            {state === 'pending' && request && (
              <LoadingButton type="button" className="join-request-button join-request-button--secondary" onClick={cancel} loading={cancelling} loadingLabel={t('joinRequest.cancel')}>
                {t('joinRequest.cancel')}
              </LoadingButton>
            )}
            {(state === 'rejected' || state === 'banned' || state === 'error') && (
              <button type="button" className="join-request-button join-request-button--secondary" onClick={() => navigate('/')}><BackIcon /><span>{t('joinRequest.back')}</span></button>
            )}
          </footer>
        </section>
      </div>
    </PublicLayout>
  );
};

export default JoinRequestPage;
