import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import GuestFields from '../../../shared/components/GuestFields';
import LoadingButton from '../../../shared/components/LoadingButton';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromUser } from '../../profile/utils/avatarKey';
import { joinTrip } from '../../trips/api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';
import { buildAuthUrl, nextFromLocation } from '../../../auth/safeNext';
import { requestTokenKey } from '../../../pages/JoinRequestPage';
import useJoinCapability from '../hooks/useJoinCapability';
import { parseJoinInput } from '../utils/parseJoinInput';
import { getJoinErrorKey } from '../joinErrors';
import TripJoinPreview from '../components/TripJoinPreview';
import '../styles/joinTrip.css';

/*
  Capability-driven state machine -- every meaningful decision (can this
  identity join directly, does it need to request approval, is it already
  a member, is it banned, does this trip require an invitation) comes from
  GET /join/capability/'s `action` field, never invented client-side.
  Submitting still independently re-validates everything server-side (see
  apps.trips.views.join_view) -- this page never treats a capability read
  as authorization on its own.

  Lookup always requires an explicit action -- the FIND TRIP button click
  or Enter as a convenience -- never a passive trigger like blur. Pasting
  a complete code/link auto-commits the lookup (optional enhancement) but
  never fires on every keystroke.

  A parsed "token" input (an invitation link, as opposed to a plain join
  code) hands off to the dedicated /invite/:token flow immediately rather
  than duplicating invitation-acceptance/OTP-verification logic here.
*/
const JoinTripPage = () => {
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const guestProfile = location.state?.guestProfile || null;

  const [inputValue, setInputValue] = useState('');
  const [committedInput, setCommittedInput] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState('');
  const [formGuest, setFormGuest] = useState({ guest_name: guestProfile?.display_name || '', avatar_key: 'avatar_02' });

  const { data: capability, loading: lookingUp, error: lookupError, parsed } = useJoinCapability(committedInput);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get('code') || params.get('token');
    if (!prefill) return;
    const parsedPrefill = parseJoinInput(prefill);
    if (parsedPrefill?.mode === 'token') {
      navigate(`/invite/${parsedPrefill.value}`, { replace: true });
      return;
    }
    setInputValue(prefill);
    setCommittedInput(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitLookup = (raw) => {
    const parsedNow = parseJoinInput(raw ?? inputValue);
    if (parsedNow?.mode === 'token') {
      navigate(`/invite/${parsedNow.value}`);
      return;
    }
    setServerErrorKey('');
    setCommittedInput(raw ?? inputValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitLookup();
    }
  };

  // Pasting a complete code/link may auto-start the lookup -- convenience
  // only, the FIND TRIP button always remains the primary, visible action.
  const handlePaste = (event) => {
    const pasted = event.clipboardData?.getData('text');
    if (pasted && parseJoinInput(pasted)) {
      setInputValue(pasted);
      commitLookup(pasted);
    }
  };

  const cancel = () => navigate(user ? '/dashboard' : '/');
  const changeIdentity = () => navigate(buildAuthUrl(nextFromLocation(location)));

  const action = capability?.action;
  const trip = capability?.trip;
  const canSubmit = action === 'ready_open' || action === 'ready_request';

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !canSubmit || parsed?.mode !== 'code') return;
    setSubmitting(true);
    setServerErrorKey('');
    try {
      const payload = { join_code: parsed.value, password };
      if (!user) {
        if (guestProfile) {
          const { display_name, ...avatarFields } = guestProfile;
          Object.assign(payload, avatarFields, { guest_name: display_name });
        } else {
          Object.assign(payload, formGuest);
        }
      }
      const result = await joinTrip(payload);
      if (result.join_request) {
        if (result.request_token) sessionStorage.setItem(requestTokenKey(result.join_request.id), result.request_token);
        navigate(`/join-request/${result.join_request.id}`);
      } else {
        navigate(`/trips/${result.trip.id}/overview`);
      }
    } catch (err) {
      setServerErrorKey(getJoinErrorKey(err));
    } finally {
      setSubmitting(false);
    }
  };

  const identity = user
    ? { avatarKey: avatarKeyFromUser(user), displayName: user.display_name }
    : guestProfile
      ? { avatarKey: avatarKeyFromUser(guestProfile), displayName: guestProfile.display_name }
      : null;

  return (
    <PublicLayout>
      <div className="jt-page">
        <div className="jt-card">
          <header className="jt-card__header">
            <button type="button" className="jt-back" onClick={cancel} aria-label={t('common.cancel')}>
              <i className="bi bi-arrow-left jt-back__icon" aria-hidden="true" />
            </button>
            <h1 className="jt-title text-headline-lg">{t('joinTrip.pageTitle')}</h1>
          </header>

          {authLoading ? (
            <div className="jt-card__body"><NeoLoading /></div>
          ) : (
            <form onSubmit={submit} noValidate className="jt-card__form">
              <div className="jt-card__body">
                <div className="jt-field">
                  <label className="jt-field__label text-label" htmlFor="jt-code">{t('joinTrip.codeOrLink')}</label>
                  <div className="jt-field__control">
                    <i className="bi bi-link-45deg jt-field__icon" aria-hidden="true" />
                    <input
                      id="jt-code"
                      className="jt-field__input"
                      type="text"
                      value={inputValue}
                      onChange={(event) => setInputValue(event.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      placeholder={t('joinTrip.codeOrLinkPlaceholder')}
                      autoComplete="off"
                    />
                  </div>
                  <p className="jt-field__helper text-copy-sm">{t('joinTrip.codeOrLinkHelper')}</p>
                  <LoadingButton
                    type="button"
                    className="jt-btn jt-btn--primary jt-find-btn"
                    onClick={() => commitLookup()}
                    disabled={!inputValue.trim()}
                    loading={lookingUp}
                    loadingLabel={t('joinTrip.findingTrip')}
                  >
                    <span>{t('joinTrip.findTrip')}</span>
                    <i className="bi bi-search jt-find-btn__icon" aria-hidden="true" />
                  </LoadingButton>
                </div>

                {!lookingUp && lookupError && <p className="jt-error" role="alert">{t(getJoinErrorKey(lookupError))}</p>}

                {!lookingUp && trip && <TripJoinPreview trip={trip} />}

                {action === 'already_member' && <p className="jt-status text-copy">{t('joinTrip.states.alreadyMember')}</p>}
                {action === 'invite_required' && <p className="jt-status text-copy">{t('joinTrip.states.inviteRequired')}</p>}
                {action === 'already_requested' && <p className="jt-status text-copy">{t('joinRequest.waiting')}</p>}
                {action === 'banned' && (
                  <p className="jt-error" role="alert">
                    {capability.banned_until ? t('joinTrip.states.bannedUntil', { date: new Date(capability.banned_until).toLocaleString() }) : t('joinTrip.states.banned')}
                  </p>
                )}

                {trip?.password_required && canSubmit && (
                  <div className="jt-field">
                    <label className="jt-field__label text-label" htmlFor="jt-password">{t('joinTrip.roomPassword')}</label>
                    <div className="jt-field__control">
                      <i className="bi bi-key jt-field__icon" aria-hidden="true" />
                      <input
                        id="jt-password"
                        className="jt-field__input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={t('joinTrip.roomPasswordPlaceholder')}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                )}

                {!identity && canSubmit && (
                  <GuestFields values={formGuest} onChange={setFormGuest} namePlaceholder={t('guest.displayNamePlaceholder')} />
                )}

                {serverErrorKey && <p className="jt-error" role="alert">{t(serverErrorKey)}</p>}
              </div>

              <footer className="jt-footer">
                {identity && canSubmit && (
                  <div className="jt-footer__identity">
                    <Avatar avatarKey={identity.avatarKey} displayName={identity.displayName} size="sm" />
                    <div className="jt-footer__identity-text">
                      <span className="text-label">{t('joinTrip.joiningAs')}</span>
                      <span className="text-copy">{identity.displayName}</span>
                    </div>
                    <button type="button" className="jt-footer__change text-label" onClick={changeIdentity}>
                      {t('joinTrip.change')}
                    </button>
                  </div>
                )}
                <div className="jt-actions">
                  <button type="button" className="jt-btn jt-btn--secondary" onClick={cancel}>{t('common.cancel')}</button>
                  {canSubmit && (
                    <LoadingButton
                      className="jt-btn jt-btn--primary"
                      loading={submitting}
                      loadingLabel={action === 'ready_request' ? t('joinTrip.requesting') : t('joinTrip.joiningLoading')}
                    >
                      <span>{action === 'ready_request' ? t('joinTrip.requestToJoin') : t('joinTrip.joinTripButton')}</span>
                      <i className="bi bi-arrow-right jt-submit__icon" aria-hidden="true" />
                    </LoadingButton>
                  )}
                  {action === 'already_member' && (
                    <button type="button" className="jt-btn jt-btn--primary" onClick={() => navigate(`/trips/${capability.trip_id}/overview`)}>
                      {t('joinTrip.openTrip')}
                    </button>
                  )}
                  {action === 'already_requested' && (
                    <button type="button" className="jt-btn jt-btn--primary" onClick={() => navigate(`/join-request/${capability.request_id}`)}>
                      {t('joinRequest.sent')}
                    </button>
                  )}
                </div>
              </footer>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default JoinTripPage;
