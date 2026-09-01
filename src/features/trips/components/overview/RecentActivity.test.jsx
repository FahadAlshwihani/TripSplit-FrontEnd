import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecentActivity from './RecentActivity';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));
// RecentActivity builds its own navigation link from trip.short_code
// (via useOutletContext) rather than a tripId prop -- see TripLayout's
// own comment on why.
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useOutletContext: () => ({ trip: { short_code: 't1' } }) }));

const events = [
  {
    id: 'a1',
    event_type: 'expense_created',
    actor: { display_name: 'Sarah', avatar: { type: 'initials', key: 'i1' } },
    summary: { title: 'Ski Pass Rental', amount: '1200.00', currency: 'SAR', scope: 'shared' },
    created_at: '2026-12-14T10:00:00Z',
  },
];

const renderActivity = (list = events) => render(
  <MemoryRouter>
    <RecentActivity events={list} currency="SAR" tripId="t1" />
  </MemoryRouter>,
);

test('header labels use the canonical i18n keys (readable in every configured language)', () => {
  renderActivity();
  expect(screen.getByText('dashboard.overview.columnDescription')).toBeInTheDocument();
  expect(screen.getByText('dashboard.overview.columnDate')).toBeInTheDocument();
  expect(screen.getByText('dashboard.overview.columnAmount')).toBeInTheDocument();
});

test('header labels never inherit the legacy invisible-text class -- each carries the color-fix class', () => {
  renderActivity();
  document.querySelectorAll('.ov-activity-list__head span').forEach((span) => {
    expect(span).toHaveClass('ov-activity-list__head-cell');
  });
});

test('the Date and Amount header cells use the centered-column class (never left/right, in either language)', () => {
  renderActivity();
  const dateHead = screen.getByText('dashboard.overview.columnDate');
  const amountHead = screen.getByText('dashboard.overview.columnAmount');
  expect(dateHead).toHaveClass('ov-activity-list__head-cell--center');
  expect(amountHead).toHaveClass('ov-activity-list__head-cell--center');
  const descriptionHead = screen.getByText('dashboard.overview.columnDescription');
  expect(descriptionHead).not.toHaveClass('ov-activity-list__head-cell--center');
});

test('the Date and Amount row cells carry the classes the centered-alignment CSS targets', () => {
  // overview.css isn't loaded in this isolated component test (only
  // TripOverviewPage imports it), so the actual computed text-align
  // can't be asserted here -- see overview.css's own
  // .ov-activity-row__date/__amount rules for the real centering.
  renderActivity();
  expect(document.querySelector('.ov-activity-row__date')).toBeInTheDocument();
  expect(document.querySelector('.ov-activity-row__amount')).toBeInTheDocument();
});

test('date and amount cells share one markup structure via the meta wrapper (no separate mobile/desktop DOM)', () => {
  renderActivity();
  const meta = document.querySelector('.ov-activity-row__meta');
  expect(meta).toBeInTheDocument();
  expect(meta.querySelector('.ov-activity-row__date')).toBeInTheDocument();
  expect(meta.querySelector('.ov-activity-row__amount')).toBeInTheDocument();
});

test('the description title and payer/scope context are direction-flow text, not centered or hardcoded', () => {
  renderActivity();
  const title = screen.getByText('Ski Pass Rental');
  expect(title).not.toHaveStyle({ textAlign: 'center' });
  expect(title.style.textAlign).toBe('');
});

test('the shared/personal scope label localizes through an i18n key, not a hardcoded English word', async () => {
  renderActivity();
  expect(await screen.findByText(/dashboard\.overview\.paidBy/)).toBeInTheDocument();
});

test('the financial amount stays bidi-safe and uses the tabular numeric variant', () => {
  renderActivity();
  const amount = document.querySelector('.ov-activity-row__amount');
  expect(amount.tagName.toLowerCase()).toBe('bdi');
  expect(amount).toHaveAttribute('dir', 'ltr');
  expect(amount).toHaveClass('money--tabular');
});

test('an empty activity feed shows the empty-state message, not a broken/empty table', () => {
  renderActivity([]);
  expect(screen.getByText('dashboard.overview.noActivity')).toBeInTheDocument();
});
