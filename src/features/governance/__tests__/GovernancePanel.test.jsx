import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GovernancePanel from '../components/GovernancePanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));

const trip = { title: 'Trip', join_code: 'ABC12345', join_policy: 'open' };
const fullCapabilities = { can_view_governance: true, can_review_join_requests: true, can_invite: true, can_resend_invite: true, can_revoke_invite: true, can_manage_bans: true, can_unban: true, can_manage_invite_link: true, can_manage_approval_setting: true };

test('renders pending request and calls approval action', () => {
  const onReview = jest.fn();
  render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[{ id: 'r1', display_name: 'Guest', avatar_key: 'avatar_01', identity_type: 'guest' }]} invitations={[]} bans={[]} onReview={onReview} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  expect(screen.getByText('Guest')).toBeInTheDocument();
  fireEvent.click(screen.getByText('governance.approve'));
  expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), 'approve');
});

test('the desktop grid uses the literal Stitch 8/12 + 4/12 column spans, not a percentage/minmax approximation', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
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

test('Join Requests and Invitations float their heading outside the bordered list -- Stitch\'s composition, not a card wrapping both', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  const sections = container.querySelectorAll('.gov-grid__main > .gov-section');
  expect(sections.length).toBe(2);
  sections.forEach((section) => {
    expect(section.querySelector('.gov-section-head').closest('.gov-list')).toBeNull();
  });
});

test('the page header title carries a visible border, matching Stitch\'s border-b-2', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  expect(container.querySelector('.gov-header__title')).toBeInTheDocument();
});
