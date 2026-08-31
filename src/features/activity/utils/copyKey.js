// Resolves the ordered i18n key candidates for one activity row's
// predicate text. A few event types (currently only settlement_created)
// read differently depending on metadata.origin -- e.g. a debtor
// reporting a payment reads differently from a creditor recording one
// they received, even though both share the same event_type. i18next's
// array-of-keys `t()` form tries each key in order and silently falls
// through to the next when one is missing, so an origin-specific key
// that hasn't been translated never breaks -- it just falls back to the
// event's own base copy, and ultimately to the generic unknown-event
// fallback if even that base key is somehow missing (see
// activityRegistryCompleteness.test.js, which guards against that ever
// actually happening for a known event type).
export const activityCopyKeys = (event) => {
  const base = `activity.${event.event_type}`;
  const origin = event.summary?.origin;
  const keys = origin ? [`${base}.${origin}`, base] : [base];
  return [...keys, 'activity.unknownEvent'];
};

// member_role_changed's metadata.role is a raw backend enum value
// ("admin"/"member"), never meant for direct display -- every other
// role label in the app goes through t('role.<code>') first (see
// MemberDetail, MembersPanel). Interpolating the raw code straight into
// an Arabic sentence would paste an untranslated English word into the
// middle of it, so this resolves it through the same role.* keys before
// handing interpolation vars to t().
export const activityCopyVars = (t, event) => {
  const summary = event.summary || {};
  if (event.event_type === 'member_role_changed' && summary.role) {
    return { ...summary, role: t(`role.${summary.role}`) };
  }
  return summary;
};
