// The one canonical builder for every human, localized share/copy
// message the app sends -- never duplicate string assembly per
// feature (Governance, Fund, Settlements, Members, notifications all
// funnel through this). Language comes from whichever `t` the caller
// already holds (i.e. the app's current i18n locale, react-i18next's
// own `i18n.language`) -- this file never inspects the browser
// language independently.
//
// `linkType`:
//   'join'       -- a join/access link. `joinPolicy` (the trip's real
//                    Trip.join_policy, never a frontend guess) picks
//                    the template; `password` is included ONLY when
//                    truthy AND the caller actually has it in hand.
//                    The backend hashes the trip password
//                    (django.contrib.auth.hashers.make_password) and
//                    never returns it after save -- the only place a
//                    real value can honestly be passed here is the
//                    Settings page's own in-memory draft, at the
//                    moment the user is actively typing/has just set
//                    it. No other caller in the app has a real
//                    password value to pass, and none should ever
//                    fake one.
//   'fund'       -- a contextual Fund/round deep link. Never includes
//                    a password, regardless of whether one is
//                    configured -- this is an internal-member link,
//                    not a join/access link.
//   'settlement' -- a contextual settlement deep link. Same rule:
//                    never includes a password.
export function buildTripShareMessage({ t, tripName, url, joinPolicy, password, linkType = 'join' }) {
  if (linkType === 'fund') return t('share.fund', { tripName, url });
  if (linkType === 'settlement') return t('share.settlement', { tripName, url });

  const key = password
    ? `share.join.${joinPolicy}WithPassword`
    : `share.join.${joinPolicy}`;
  return t(key, { tripName, url, password });
}
