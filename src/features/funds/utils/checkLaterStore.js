// Lightweight, purely-cosmetic persistence for the Fund pending-
// contribution "check later" dismissal (see FundingRoundLedgerCard).
// Never touches contribution status or the Fund balance -- it only
// remembers which pending rows the holder already said "not now" to,
// keyed by the contribution's own globally-unique id, so the dismissal
// survives a reload/revisit instead of resetting on every mount. A
// dismissed row still stays fully visible in the pending list -- this
// only suppresses its confirm/reject/check-later action prompt.
const STORAGE_KEY = 'tripsplit:fund-checked-later';

const readSet = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const writeSet = (set) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Best-effort only -- a write failure (quota, private mode) just
    // means the dismissal won't survive a reload; it must never break
    // the actual review flow.
  }
};

export const loadCheckedLater = () => readSet();

export const markCheckedLater = (contributionId) => {
  const set = readSet();
  set.add(contributionId);
  writeSet(set);
  return set;
};
