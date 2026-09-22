import { useState } from 'react';

const PREFIX = 'trip-intelligence-dismissed:v1';

// Persist only opaque, machine-derived signatures. Names, amounts, tokens,
// and API responses never enter sessionStorage as readable values.
function fingerprint(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}

function magnitudeBand(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount !== 0 ? Math.floor(Math.log2(Math.abs(amount))) : 0;
}

export function insightDismissalKey(tripId, item, snapshot) {
  const meaning = [
    item.code,
    item.category?.code,
    item.category?.risk,
    item.payer?.member_id,
    snapshot?.health?.status,
    ...(snapshot?.health?.reasons || []),
    ...(item.code === 'closeout_blockers' || item.code === 'closeout_checklist'
      ? (snapshot?.closeout?.blockers || []).map((blocker) => `${blocker.code}:${magnitudeBand(blocker.amount ?? blocker.count)}`).sort() : []),
    magnitudeBand(item.amount ?? item.outstanding ?? item.projected_total),
    item.code === 'financial_risk' ? magnitudeBand(snapshot?.health?.spent) : null,
    item.code === 'fund_shortfall' ? magnitudeBand(snapshot?.fund?.available) : null,
    item.code === 'next_payer' ? magnitudeBand(item.payer?.balance_before) : null,
    item.runway_days == null ? null : Math.floor(Number(item.runway_days) / 2),
  ];
  return `${PREFIX}:${fingerprint(String(tripId))}:${item.code}:${fingerprint(JSON.stringify(meaning))}`;
}

function sessionStore() {
  try { return window.sessionStorage; } catch { return null; }
}

export default function useDismissedInsights(tripId) {
  const [dismissedHere, setDismissedHere] = useState(() => new Set());

  const isDismissed = (item, snapshot) => {
    const key = insightDismissalKey(tripId, item, snapshot);
    if (dismissedHere.has(key)) return true;
    try { return sessionStore()?.getItem(key) === '1'; } catch { return false; }
  };

  const dismiss = (item, snapshot) => {
    const key = insightDismissalKey(tripId, item, snapshot);
    setDismissedHere((current) => new Set(current).add(key));
    try { sessionStore()?.setItem(key, '1'); } catch { /* Keep the in-memory dismissal when storage is unavailable. */ }
  };

  return { isDismissed, dismiss };
}
