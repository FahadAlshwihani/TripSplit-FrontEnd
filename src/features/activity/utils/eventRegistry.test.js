import en from '../../../i18n/locales/en.json';
import ar from '../../../i18n/locales/ar.json';
import { EVENT_REGISTRY, FAMILIES, KNOWN_EVENT_TYPES, eventAmount, eventFamily, eventIcon, eventTone, familyEventTypes } from './eventRegistry';

// Snapshot of every TripActivity.EventType value the backend can emit,
// as of the audit this file was written for (see
// apps/trips/models.py:TripActivity.EventType on the backend -- a
// separate repo, so this can't be read directly by a frontend test).
// A brand new backend event type won't fail THIS test until someone
// adds it here -- that's an accepted gap, closed by the OTHER half of
// the safety net: ActivityPanel's unknown-event fallback (see
// copyKey.js/activity.unknownEvent) means an event type missing from
// this list still renders safely at runtime, it just won't get this
// test's completeness guarantee until it's added here too.
const BACKEND_EVENT_TYPES = [
  'trip_created', 'trip_updated', 'trip_archived', 'trip_restored', 'trip_closed', 'trip_reopened',
  'member_joined', 'member_removed', 'member_left', 'member_kicked', 'member_role_changed', 'ownership_transferred', 'member_banned', 'member_unbanned', 'guest_identity_claimed',
  'expense_created', 'expense_updated', 'expense_deleted', 'expense_currency_changed', 'expense_exchange_rate_changed',
  'settlement_created', 'settlement_updated', 'settlement_deleted', 'settlement_confirmed', 'settlement_rejected', 'settlement_cancelled', 'settlement_check_later', 'settlement_retry_requested',
  'join_request_created', 'join_request_approved', 'join_request_rejected',
  'invitation_created', 'invitation_revoked', 'invitation_accepted', 'join_policy_changed', 'join_code_rotated',
  'fund_created', 'fund_holder_changed', 'funding_round_created', 'funding_round_completed', 'funding_round_cancelled',
  'fund_contribution_recorded', 'fund_contribution_reported', 'fund_contribution_confirmed', 'fund_contribution_rejected', 'fund_contribution_retry_requested', 'fund_contribution_updated', 'fund_contribution_voided',
  'fund_refund_recorded', 'fund_reimbursement_recorded', 'fund_closed',
  'guest_identity_claimed', 'balance_reminder_sent', 'balance_reminder_bulk_sent', 'fund_contribution_reminder_sent',
];
// De-duplicate (guest_identity_claimed is listed once above in its
// membership grouping and once in the migration's own append order --
// keeping both spellings above documents intent without asserting a
// count) -- the count assertion below only cares about the resulting set.
const BACKEND_EVENT_TYPE_SET = [...new Set(BACKEND_EVENT_TYPES)];

describe('event registry completeness', () => {
  test('every known backend event type has a registry entry (family + icon)', () => {
    const missing = BACKEND_EVENT_TYPE_SET.filter((type) => !EVENT_REGISTRY[type]);
    expect(missing).toEqual([]);
  });

  test('every registry entry maps to one of the declared families', () => {
    KNOWN_EVENT_TYPES.forEach((type) => {
      expect(FAMILIES).toContain(eventFamily(type));
    });
  });

  test('every registry entry has a real bootstrap-icons class, never a placeholder', () => {
    KNOWN_EVENT_TYPES.forEach((type) => {
      expect(eventIcon(type)).toMatch(/^bi-[a-z0-9-]+$/);
    });
  });

  test('every registry event type has EN copy -- never falls through to the raw key', () => {
    KNOWN_EVENT_TYPES.forEach((type) => {
      expect(en[`activity.${type}`]).toBeTruthy();
    });
  });

  test('every registry event type has AR copy -- never falls through to the raw key', () => {
    KNOWN_EVENT_TYPES.forEach((type) => {
      expect(ar[`activity.${type}`]).toBeTruthy();
    });
  });

  test('the generic unknown-event fallback exists in both locales, for a future event type this registry has not learned yet', () => {
    expect(en['activity.unknownEvent']).toBeTruthy();
    expect(ar['activity.unknownEvent']).toBeTruthy();
  });

  test('every declared family has at least one event type mapped to it', () => {
    FAMILIES.forEach((family) => {
      expect(familyEventTypes(family).length).toBeGreaterThan(0);
    });
  });

  test('eventTone never throws and always returns a string for any event type, known or not', () => {
    expect(eventTone('trip_created')).toBe('neutral');
    expect(eventTone('some_future_event_type')).toBe('neutral');
  });

  test('eventAmount returns null (a neutral "no value" row) for an event type with no amount definition', () => {
    expect(eventAmount({ event_type: 'member_joined', summary: {} })).toBeNull();
    expect(eventAmount({ event_type: 'trip_updated', summary: { amount: '10.00' } })).toBeNull();
  });

  test('eventAmount returns null when the event type IS amount-bearing but this particular row has no amount data', () => {
    expect(eventAmount({ event_type: 'expense_created', summary: {} })).toBeNull();
  });

  test('eventAmount surfaces value/currency/sign/tone for a real amount-bearing row', () => {
    expect(eventAmount({ event_type: 'fund_contribution_recorded', summary: { amount: '500.00', currency: 'SAR' } }))
      .toEqual({ value: '500.00', currency: 'SAR', sign: '+', tone: 'success' });
  });
});
