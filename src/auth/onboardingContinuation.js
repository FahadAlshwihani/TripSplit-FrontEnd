import { getSafeNext } from './safeNext';
import { parseJoinInput } from '../features/join/utils/parseJoinInput';

export const CONTINUATION_STATE_KEY = 'onboardingContinuation';

const invitationPathPattern = /^\/invite\/([^/?#]+)$/;

// A continuation is deliberately a small discriminated value, never an
// arbitrary redirect. The backend still re-validates the token/code before
// performing any action; this descriptor only tells the destination screen
// that profile onboarding has just completed and its already-visible intent
// should be consumed once.
export const continuationFromPath = (path) => {
  const safePath = getSafeNext(`?next=${encodeURIComponent(path || '')}`, null);
  if (!safePath) return { type: 'default', returnPath: '/account' };

  const url = new URL(safePath, 'https://tripsplit.invalid');
  const invitationMatch = url.pathname.match(invitationPathPattern);
  if (invitationMatch) {
    return { type: 'invitation', token: invitationMatch[1], returnPath: `${url.pathname}${url.search}` };
  }

  if (url.pathname === '/trips/join') {
    const parsed = parseJoinInput(url.searchParams.get('code') || url.searchParams.get('token'));
    if (parsed?.mode === 'code') {
      return { type: 'join_code', joinCode: parsed.value, returnPath: `${url.pathname}${url.search}` };
    }
    if (parsed?.mode === 'token') {
      return { type: 'invitation', token: parsed.value, returnPath: `/invite/${encodeURIComponent(parsed.value)}` };
    }
  }

  return { type: 'default', returnPath: safePath };
};

export const postProfileNavigation = (path) => {
  const continuation = continuationFromPath(path);
  return {
    to: continuation.returnPath,
    state: { [CONTINUATION_STATE_KEY]: continuation },
  };
};

export const continuationFromLocation = (location) => {
  const candidate = location?.state?.[CONTINUATION_STATE_KEY];
  if (!candidate || typeof candidate !== 'object') return null;
  if (candidate.type === 'join_code' && parseJoinInput(candidate.joinCode)?.mode === 'code') return candidate;
  if (candidate.type === 'invitation' && typeof candidate.token === 'string' && candidate.token.length > 12) return candidate;
  if (candidate.type === 'default' && getSafeNext(`?next=${encodeURIComponent(candidate.returnPath || '')}`, null)) return candidate;
  return null;
};
