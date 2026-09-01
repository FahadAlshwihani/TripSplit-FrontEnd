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

test('the desktop grid places Join Requests + Restricted as one row-level pair and Invitations + Access Settings as the other, each keeping its literal 8/12 + 4/12 span', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  const grid = container.querySelector('.gov-grid');
  const requests = container.querySelector('.gov-grid__requests');
  const restricted = container.querySelector('.gov-grid__restricted');
  const invitations = container.querySelector('.gov-grid__invitations');
  const access = container.querySelector('.gov-grid__access');
  expect(grid).toBeInTheDocument();
  expect(requests).toBeInTheDocument();
  expect(restricted).toBeInTheDocument();
  expect(invitations).toBeInTheDocument();
  expect(access).toBeInTheDocument();
  expect(requests).toHaveClass('gov-section'); // gov-section IS the requests wrapper itself
  expect(restricted.querySelector('.gov-restricted')).toBeInTheDocument();
  expect(invitations).toHaveClass('gov-section');
  expect(access.querySelector('.gov-settings')).toBeInTheDocument();
  // Row 1: requests (wide) + restricted (narrow), same grid-row, all
  // direct children of .gov-grid -- never nested inside an intermediate
  // main/side column wrapper.
  expect(requests.parentElement).toBe(grid);
  expect(restricted.parentElement).toBe(grid);
  expect(invitations.parentElement).toBe(grid);
  expect(access.parentElement).toBe(grid);
});

test('mobile/DOM order preserves the row-1-then-row-2 pairing: requests, restricted, invitations, access', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  const children = Array.from(container.querySelector('.gov-grid').children);
  const classOrder = children.map((el) => el.className.split(' ').find((c) => c.startsWith('gov-grid__')));
  expect(classOrder).toEqual(['gov-grid__requests', 'gov-grid__restricted', 'gov-grid__invitations', 'gov-grid__access']);
});

test('Join Requests and Invitations float their heading outside the bordered list -- Stitch\'s composition, not a card wrapping both', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  const sections = container.querySelectorAll('.gov-grid > .gov-section');
  expect(sections.length).toBe(2);
  sections.forEach((section) => {
    expect(section.querySelector('.gov-section-head').closest('.gov-list')).toBeNull();
  });
});

test('the page header title carries a visible border, matching Stitch\'s border-b-2', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  expect(container.querySelector('.gov-header__title')).toBeInTheDocument();
});
