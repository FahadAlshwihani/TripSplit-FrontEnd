import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLayout from '../../../components/Layout/PublicLayout';
import NeoLoading from '../../../shared/components/NeoLoading';
import GuestFields from '../../../shared/components/GuestFields';
import LoadingButton from '../../../shared/components/LoadingButton';
import Avatar from '../../profile/components/Avatar';
import ProfileSetupPage from '../../profile/pages/ProfileSetupPage';
import { avatarKeyFromUser } from '../../profile/utils/avatarKey';
import { joinTrip } from '../../trips/api/tripsApi';
import { useAuth } from '../../../auth/AuthContext';
import { nextFromLocation } from '../../../auth/safeNext';
import { requestTokenKey } from '../../../pages/JoinRequestPage';
import { loadGuestProfile, saveGuestProfile } from '../../../shared/guestProfileStore';
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
  // A device that already picked a guest identity (this session's AuthPage
  // hand-off, or a saved profile from an earlier visit -- see
  // shared/guestProfileStore.js) never has to redo name/avatar setup.
  // Kept as local state (not re-derived from location.state every render)
  // so editing it via "Change" below takes effect immediately.
  const [guestProfile, setGuestProfile] = useState(() => location.state?.guestProfile || loadGuestProfile());
  const [editingGuestIdentity, setEditingGuestIdentity] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [committedInput, setCommittedInput] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverErrorKey, setServerErrorKey] = useState('');
  const [formGuest, setFormGuest] = useState({ guest_name: guestProfile?.display_name || '', avatar_key: 'avatar_02' });

  const { data: capability, loading: lookingUp, error: lookupError, parsed } = useJoinCapability(committedInput);

  // The displayed result must always correspond to the latest COMMITTED
  // search, not merely the latest resolved one: the instant the field's
  // raw text diverges from what was last committed, the previous
  // trip/action/error/password state is stale and must stop rendering as
  // if it still applies -- without waiting for a new request to fail or
  // even to start. useJoinCapability's underlying useRouteResource call
  // also clears `data` itself the moment a NEW lookup starts (see its
  // `resetOnKeyChange` flag), so a late response can never resurrect a
  // stale preview either way -- this covers the gap in between.
  const isStale = Boolean(committedInput) && inputValue !== committedInput;
  const action = isStale ? undefined : capability?.action;
  const trip = isStale ? undefined : capability?.trip;
  const effectiveLookupError = isStale ? null : lookupError;

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
    // A brand-new lookup starts with a clean slate -- the previous trip's
    // password entry and any submit error from a previous attempt must not
    // silently carry over onto whatever this new code/link resolves to.
    setServerErrorKey('');
    setPassword('');
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
  // A registered user edits their real account profile (existing
  // /account/profile route); a guest edits the local device profile
  // inline, right here, without ever being sent through the login
  // gateway. Both cases return to this exact Join Trip attempt afterwards
  // -- the registered case via safe internal `next` continuation, the
  // guest case because it never actually leaves the page.
  const changeIdentity = () => {
    if (user) navigate('/account/profile', { state: { next: nextFromLocation(location) } });
    else setEditingGuestIdentity(true);
  };
  const saveGuestIdentity = (profile) => {
    saveGuestProfile(profile);
    setGuestProfile(profile);
    setEditingGuestIdentity(false);
  };

  const canSubmit = action === 'ready_open' || action === 'ready_request';

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || !canSubmit || parsed?.mode !== 'code') return;
    setSubmitting(true);
    setServerErrorKey('');
    try {
      const payload = { join_code: parsed.value, password };
      if (!user) {
        const profile = guestProfile || { display_name: formGuest.guest_name, avatar_key: formGuest.avatar_key };
        const { display_name, ...avatarFields } = profile;
        Object.assign(payload, avatarFields, { guest_name: display_name });
        saveGuestProfile(profile);
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

  if (editingGuestIdentity) {
    return (
      <ProfileSetupPage
        mode="guest"
        busy={false}
        errorKey={null}
        initialValues={guestProfile}
        onSubmit={saveGuestIdentity}
        onCancel={() => setEditingGuestIdentity(false)}
      />
    );
  }

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

                {!lookingUp && effectiveLookupError && <p className="jt-error" role="alert">{t(getJoinErrorKey(effectiveLookupError))}</p>}

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

                {!isStale && serverErrorKey && <p className="jt-error" role="alert">{t(serverErrorKey)}</p>}
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
