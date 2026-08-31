import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ActivityPanel from './ActivityPanel';

// Mirrors the real i18next array-fallback contract activityCopyKeys()
// relies on (see copyKey.js): a key array resolves to the first entry
// this fake dictionary "knows", falling through to the last entry
// (production's activity.unknownEvent) otherwise -- lets tests exercise
// the genuine fallback path without needing the real translation bundle.
const KNOWN_KEYS = ['activity.trip_updated', 'activity.member_joined', 'activity.expense_created', 'activity.fund_contribution_recorded', 'activity.member_role_changed'];
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, vars) => {
      const keys = Array.isArray(key) ? key : [key];
      const resolved = keys.find((candidate) => KNOWN_KEYS.includes(candidate)) || keys[keys.length - 1];
      return vars && Object.keys(vars).length ? `${resolved}:${JSON.stringify(vars)}` : resolved;
    },
    i18n: { language: 'en' },
  }),
}));

const baseEvent = { id: 'e1', event_type: 'trip_updated', created_at: '2026-08-20T12:30:00Z', actor: null, summary: {} };

test('activity timestamps follow app locale and remain LTR in RTL layouts', () => {
  render(<ActivityPanel events={[baseEvent]} />);
  const timestamp = screen.getByText(new Intl.DateTimeFormat('en', { timeStyle: 'short' }).format(new Date('2026-08-20T12:30:00Z')));
  expect(timestamp.closest('bdi')).toHaveAttribute('dir', 'ltr');
});

test('groups consecutive events by calendar day under one date-group heading, oldest group last (server already sorts newest-first)', () => {
  const events = [
    { ...baseEvent, id: 'a', created_at: '2026-08-21T10:00:00Z' },
    { ...baseEvent, id: 'b', created_at: '2026-08-20T09:00:00Z' },
    { ...baseEvent, id: 'c', created_at: '2026-08-20T08:00:00Z' },
  ];
  const { container } = render(<ActivityPanel events={events} />);
  const groups = container.querySelectorAll('.act-group');
  expect(groups).toHaveLength(2);
  expect(within(groups[0]).getAllByRole('listitem')).toHaveLength(1);
  expect(within(groups[1]).getAllByRole('listitem')).toHaveLength(2);
});

test('never merges two non-adjacent runs of the same calendar day into one group', () => {
  const events = [
    { ...baseEvent, id: 'a', created_at: '2026-08-21T10:00:00Z' },
    { ...baseEvent, id: 'b', created_at: '2026-08-20T09:00:00Z' },
    { ...baseEvent, id: 'c', created_at: '2026-08-21T08:00:00Z' }, // same day as `a`, but not adjacent to it
  ];
  const { container } = render(<ActivityPanel events={events} />);
  expect(container.querySelectorAll('.act-group')).toHaveLength(3);
});

test('renders the actor name in bold, separately from the predicate sentence', () => {
  render(<ActivityPanel events={[{ ...baseEvent, actor: { display_name: 'Fahad' } }]} />);
  expect(screen.getByText('Fahad').tagName).toBe('STRONG');
});

test('falls back to the system label when an event has no actor (e.g. a join request being created)', () => {
  render(<ActivityPanel events={[{ ...baseEvent, event_type: 'join_request_created', actor: null }]} />);
  expect(screen.getByText('activity.system')).toBeInTheDocument();
});

test('renders a real amount via the canonical Money component for an amount-bearing event', () => {
  const event = { ...baseEvent, event_type: 'fund_contribution_recorded', summary: { amount: '500.00', currency: 'SAR' } };
  const { container } = render(<ActivityPanel events={[event]} />);
  expect(container.querySelector('.act-row__value--success')).toBeInTheDocument();
  expect(screen.getByText('SAR')).toBeInTheDocument();
  expect(screen.getByText('500.00')).toBeInTheDocument();
});

test('renders a neutral placeholder, never a fabricated amount, for an event with no amount data', () => {
  const { container } = render(<ActivityPanel events={[{ ...baseEvent, event_type: 'member_role_changed', summary: { display_name: 'Sara', role: 'admin' } }]} />);
  expect(container.querySelector('.act-row__value--muted')).toHaveTextContent('—');
});

test('an unrecognized event_type still renders safely through the generic fallback, never a raw untranslated key', () => {
  render(<ActivityPanel events={[{ ...baseEvent, event_type: 'some_future_event_type', summary: {} }]} />);
  expect(screen.getByText('activity.unknownEvent')).toBeInTheDocument();
  expect(screen.queryByText('activity.some_future_event_type')).not.toBeInTheDocument();
});

test('member_role_changed resolves the raw role code through t() before interpolating -- never pastes a raw enum value into the sentence', () => {
  render(<ActivityPanel events={[{ ...baseEvent, event_type: 'member_role_changed', summary: { display_name: 'Sara', role: 'admin' } }]} />);
  // The mocked t() stringifies its vars: role must have already been run
  // through t('role.admin') (itself resolving to that same key under
  // this mock, since 'role.admin' isn't in KNOWN_KEYS) rather than the
  // raw string "admin" leaking straight into the interpolation vars.
  expect(screen.getByText(/"role":"role\.admin"/)).toBeInTheDocument();
});

test('rows are never fake-interactive: no clickable affordance without a real navigation target', () => {
  const { container } = render(<ActivityPanel events={[baseEvent]} />);
  const row = container.querySelector('.act-row');
  expect(row.tagName).toBe('LI');
  expect(row).not.toHaveAttribute('role', 'button');
  expect(row).not.toHaveAttribute('tabindex');
});

test('activity.css never hardcodes a physical left/right/margin-left/margin-right direction', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'activity.css'), 'utf8');
  expect(css).not.toMatch(/[^-](margin|padding|border)-(left|right)\s*:/);
  expect(css).not.toMatch(/[^-]\bleft\s*:/);
  expect(css).not.toMatch(/[^-]\bright\s*:/);
});

test('no legacy dark-glassmorphism classes (card-pc / activity-row / member-avatar) remain in the Activity feature', () => {
  const panel = fs.readFileSync(path.join(__dirname, 'ActivityPanel.jsx'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '..', 'pages', 'ActivityPage.jsx'), 'utf8');
  ['card-pc', 'activity-row', 'member-avatar'].forEach((legacyClass) => {
    expect(panel).not.toContain(legacyClass);
    expect(page).not.toContain(legacyClass);
  });
});
