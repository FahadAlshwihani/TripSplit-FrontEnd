/*
  Presentation registry for every TripActivity.EventType the backend can
  emit (see apps/trips/models.py on the backend -- kept in sync there;
  activityRegistryCompleteness.test.js statically asserts this file's
  key list against that source, so a new backend event type fails CI
  here instead of silently rendering as a raw, untranslated key).

  Each entry only carries FAMILY (used by the toolbar's filter and by
  eventAmount's tone table) and ICON (a bootstrap-icons class, the same
  icon set already used everywhere else in this app -- never Stitch's
  own Material Symbols, which was a generator artifact, not this app's
  icon system). Copy itself lives in i18n (`activity.<event_type>`) --
  this file never hardcodes English/Arabic text.
*/

export const FAMILIES = ['expense', 'fund', 'settlement', 'member', 'governance', 'trip'];

const TRIP = 'trip';
const MEMBER = 'member';
const EXPENSE = 'expense';
const SETTLEMENT = 'settlement';
const FUND = 'fund';
const GOVERNANCE = 'governance';

export const EVENT_REGISTRY = {
  trip_created: { family: TRIP, icon: 'bi-flag' },
  trip_updated: { family: TRIP, icon: 'bi-pencil' },
  trip_archived: { family: TRIP, icon: 'bi-archive' },
  trip_restored: { family: TRIP, icon: 'bi-arrow-counterclockwise' },
  trip_closed: { family: TRIP, icon: 'bi-lock' },
  trip_reopened: { family: TRIP, icon: 'bi-unlock' },

  member_joined: { family: MEMBER, icon: 'bi-person-plus', tone: 'success' },
  member_removed: { family: MEMBER, icon: 'bi-person-dash' },
  member_left: { family: MEMBER, icon: 'bi-person-dash' },
  member_kicked: { family: MEMBER, icon: 'bi-person-dash', tone: 'danger' },
  member_role_changed: { family: MEMBER, icon: 'bi-shield-check' },
  ownership_transferred: { family: MEMBER, icon: 'bi-award' },
  member_banned: { family: MEMBER, icon: 'bi-slash-circle', tone: 'danger' },
  member_unbanned: { family: MEMBER, icon: 'bi-check-circle', tone: 'success' },
  guest_identity_claimed: { family: MEMBER, icon: 'bi-person-check' },

  expense_created: { family: EXPENSE, icon: 'bi-receipt' },
  expense_updated: { family: EXPENSE, icon: 'bi-receipt' },
  expense_deleted: { family: EXPENSE, icon: 'bi-receipt' },
  expense_currency_changed: { family: EXPENSE, icon: 'bi-currency-exchange' },
  expense_exchange_rate_changed: { family: EXPENSE, icon: 'bi-currency-exchange' },

  settlement_created: { family: SETTLEMENT, icon: 'bi-arrow-left-right' },
  settlement_updated: { family: SETTLEMENT, icon: 'bi-arrow-left-right' },
  settlement_deleted: { family: SETTLEMENT, icon: 'bi-arrow-left-right' },
  settlement_confirmed: { family: SETTLEMENT, icon: 'bi-check-circle', tone: 'success' },
  settlement_rejected: { family: SETTLEMENT, icon: 'bi-x-circle', tone: 'danger' },
  settlement_cancelled: { family: SETTLEMENT, icon: 'bi-x-circle' },
  settlement_check_later: { family: SETTLEMENT, icon: 'bi-clock-history' },
  settlement_retry_requested: { family: SETTLEMENT, icon: 'bi-arrow-repeat' },
  balance_reminder_sent: { family: SETTLEMENT, icon: 'bi-bell' },
  balance_reminder_bulk_sent: { family: SETTLEMENT, icon: 'bi-bell' },

  fund_created: { family: FUND, icon: 'bi-piggy-bank' },
  fund_holder_changed: { family: FUND, icon: 'bi-piggy-bank' },
  fund_closed: { family: FUND, icon: 'bi-piggy-bank' },
  funding_round_created: { family: FUND, icon: 'bi-piggy-bank' },
  funding_round_completed: { family: FUND, icon: 'bi-check-circle', tone: 'success' },
  funding_round_cancelled: { family: FUND, icon: 'bi-x-circle' },
  fund_contribution_recorded: { family: FUND, icon: 'bi-cash-coin', tone: 'success' },
  fund_contribution_reported: { family: FUND, icon: 'bi-cash-coin' },
  fund_contribution_confirmed: { family: FUND, icon: 'bi-check-circle', tone: 'success' },
  fund_contribution_rejected: { family: FUND, icon: 'bi-x-circle', tone: 'danger' },
  fund_contribution_retry_requested: { family: FUND, icon: 'bi-arrow-repeat' },
  fund_contribution_updated: { family: FUND, icon: 'bi-pencil' },
  fund_contribution_voided: { family: FUND, icon: 'bi-x-circle' },
  fund_refund_recorded: { family: FUND, icon: 'bi-cash-coin' },
  fund_reimbursement_recorded: { family: FUND, icon: 'bi-cash-coin' },
  fund_contribution_reminder_sent: { family: FUND, icon: 'bi-bell' },

  join_request_created: { family: GOVERNANCE, icon: 'bi-person-plus' },
  join_request_approved: { family: GOVERNANCE, icon: 'bi-check-circle', tone: 'success' },
  join_request_rejected: { family: GOVERNANCE, icon: 'bi-x-circle', tone: 'danger' },
  invitation_created: { family: GOVERNANCE, icon: 'bi-envelope' },
  invitation_revoked: { family: GOVERNANCE, icon: 'bi-envelope-x' },
  invitation_accepted: { family: GOVERNANCE, icon: 'bi-envelope-check', tone: 'success' },
  join_policy_changed: { family: GOVERNANCE, icon: 'bi-gear' },
  join_code_rotated: { family: GOVERNANCE, icon: 'bi-arrow-repeat' },
};

// Events with a meaningful, currently-populated amount+currency pair in
// their metadata -- everything else renders the neutral "no value" dash,
// rather than fabricating a number the backend doesn't actually send
// (e.g. funding_round_completed only carries a shortfall, never a raised
// total, so it deliberately has no entry here).
const AMOUNT_TONE = {
  expense_created: 'expense',
  expense_updated: 'expense',
  expense_deleted: 'muted',
  settlement_created: 'neutral',
  settlement_updated: 'neutral',
  settlement_deleted: 'muted',
  settlement_confirmed: 'success',
  settlement_rejected: 'danger',
  settlement_cancelled: 'muted',
  settlement_check_later: 'muted',
  settlement_retry_requested: 'muted',
  fund_contribution_recorded: 'success',
  fund_contribution_reported: 'neutral',
  fund_contribution_confirmed: 'success',
  fund_contribution_rejected: 'danger',
  fund_contribution_retry_requested: 'muted',
  fund_contribution_updated: 'muted',
  fund_contribution_voided: 'muted',
  fund_refund_recorded: 'muted',
  fund_reimbursement_recorded: 'muted',
  balance_reminder_sent: 'muted',
};

const AMOUNT_SIGN = {
  fund_contribution_recorded: '+',
  fund_contribution_reported: '+',
  fund_contribution_confirmed: '+',
  fund_refund_recorded: '-',
  fund_reimbursement_recorded: '-',
};

export const KNOWN_EVENT_TYPES = Object.keys(EVENT_REGISTRY);

export const eventFamily = (eventType) => EVENT_REGISTRY[eventType]?.family || TRIP;
export const eventIcon = (eventType) => EVENT_REGISTRY[eventType]?.icon || 'bi-info-circle';
export const eventTone = (eventType) => EVENT_REGISTRY[eventType]?.tone || 'neutral';

export const familyEventTypes = (family) => KNOWN_EVENT_TYPES.filter((type) => EVENT_REGISTRY[type].family === family);

// Returns the trailing-column amount to render, or null for a neutral
// "no value" row -- amount/currency are always the authoritative,
// already-formatted server figures (see Money), never recomputed here.
export const eventAmount = (event) => {
  const tone = AMOUNT_TONE[event.event_type];
  const summary = event.summary || {};
  if (!tone || summary.amount === undefined || summary.amount === null) return null;
  return { value: summary.amount, currency: summary.currency, sign: AMOUNT_SIGN[event.event_type] || null, tone };
};
