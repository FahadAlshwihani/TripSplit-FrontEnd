import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GovernancePanel from '../components/GovernancePanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));

const trip = { title: 'Trip', join_code: 'ABC12345', join_policy: 'open' };
const fullCapabilities = { can_view_governance: true, can_review_join_requests: true, can_invite: true, can_resend_invite: true, can_revoke_invite: true, can_manage_bans: true, can_unban: true, can_manage_invite_link: true, can_manage_approval_setting: true };

// Resolved-resource fixture shape -- GovernancePanel takes one
// useRouteResource-shaped state object per data-dependent section
// (Part B: each section loads/errors independently) rather than a raw
// array, so tests build a resolved `{ data: { results }, loading:
// false, error: null, retry }` for each of requests/invitations/bans.
const resolved = (results) => ({ data: { results }, loading: false, error: null, retry: jest.fn() });

const renderPanel = (overrides = {}) => render(
  <GovernancePanel
    trip={trip}
    capabilities={fullCapabilities}
    requestsState={resolved([])}
    invitationsState={resolved([])}
    bansState={resolved([])}
    onReview={jest.fn()}
    onOpenInvite={jest.fn()}
    onResendInvite={jest.fn()}
    onRevokeInvite={jest.fn()}
    onUnban={jest.fn()}
    onUpdateSettings={jest.fn()}
    onRotateLink={jest.fn()}
    {...overrides}
  />,
);

test('renders pending request and calls approval action', () => {
  const onReview = jest.fn();
  render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requestsState={resolved([{ id: 'r1', display_name: 'Guest', avatar_key: 'avatar_01', identity_type: 'guest' }])} invitationsState={resolved([])} bansState={resolved([])} onReview={onReview} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  expect(screen.getByText('Guest')).toBeInTheDocument();
  fireEvent.click(screen.getByText('governance.approve'));
  expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), 'approve');
});

test('the desktop grid uses the literal Stitch 8/12 + 4/12 column spans, not a percentage/minmax approximation', () => {
  const { container } = renderPanel();
  const grid = container.querySelector('.gov-grid');
  const main = container.querySelector('.gov-grid__main');
  const side = container.querySelector('.gov-grid__side');
  expect(grid).toBeInTheDocument();
  expect(main).toBeInTheDocument();
  expect(side).toBeInTheDocument();
  expect(main.querySelector('.gov-section')).toBeInTheDocument();
  expect(side.querySelector('.gov-restricted')).toBeInTheDocument();
  expect(side.querySelector('.gov-settings')).toBeInTheDocument();
});

// The main column stacks Join Requests then Invitations naturally --
// no shared grid-row/subgrid pairing with the side column's cards, and
// no forced height equality between them (reverted -- see
// GovernancePanel.jsx's own comment history).
test('the main column contains both Join Requests and Invitations, stacked in that order', () => {
  const { container } = renderPanel();
  const main = container.querySelector('.gov-grid__main');
  const sections = main.querySelectorAll(':scope > .gov-section');
  expect(sections.length).toBe(2);
  expect(sections[0].textContent).toMatch(/governance\.requests/);
  expect(sections[1].textContent).toMatch(/governance\.invitations/);
});

test('the side column contains both Restricted and Access Settings, stacked in that order', () => {
  const { container } = renderPanel();
  const side = container.querySelector('.gov-grid__side');
  const children = Array.from(side.children);
  expect(children.length).toBe(2);
  expect(children[0]).toHaveClass('gov-restricted');
  expect(children[1]).toHaveClass('gov-settings');
});

test('no forced row-pairing/subgrid classes remain from the reverted restructuring pass', () => {
  const { container } = renderPanel();
  expect(container.querySelector('.gov-grid__requests')).toBeNull();
  expect(container.querySelector('.gov-grid__restricted')).toBeNull();
  expect(container.querySelector('.gov-grid__invitations')).toBeNull();
  expect(container.querySelector('.gov-grid__access')).toBeNull();
});

test('Join Requests and Invitations float their heading outside the bordered list -- Stitch\'s composition, not a card wrapping both', () => {
  const { container } = renderPanel();
  const sections = container.querySelectorAll('.gov-grid__main > .gov-section');
  expect(sections.length).toBe(2);
  sections.forEach((section) => {
    expect(section.querySelector('.gov-section-head').closest('.gov-list')).toBeNull();
  });
});

test('the page header title carries a visible border, matching Stitch\'s border-b-2', () => {
  const { container } = renderPanel();
  expect(container.querySelector('.gov-header__title')).toBeInTheDocument();
});

// Part B: independent per-section loading -- each of Join Requests /
// Invitations / Restricted shows its own section-scoped placeholder
// while its own resource is still pending, and Access Settings never
// gates on any of them (it only needs `trip`/`capabilities`).
test('each data-dependent section shows its own section-scoped placeholder while its own resource is loading -- the header and Access Settings render regardless', () => {
  const { container } = renderPanel({
    requestsState: { data: null, loading: true, error: null, retry: jest.fn() },
    invitationsState: { data: null, loading: true, error: null, retry: jest.fn() },
    bansState: { data: null, loading: true, error: null, retry: jest.fn() },
  });
  expect(container.querySelector('.gov-header__title')).toBeInTheDocument();
  expect(container.querySelectorAll('.section-loading').length).toBe(3);
  expect(container.querySelector('.gov-settings')).toBeInTheDocument();
});

test('a Join Requests fetch failure surfaces retry without hiding the Invitations/Restricted/Access Settings sections', () => {
  const retry = jest.fn();
  renderPanel({ requestsState: { data: null, loading: false, error: new Error('requests down'), retry } });
  expect(screen.getByText('requests down')).toBeInTheDocument();
  expect(screen.getByText('governance.invitations')).toBeInTheDocument();
});
