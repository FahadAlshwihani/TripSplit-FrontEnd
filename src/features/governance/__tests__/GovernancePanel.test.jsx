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

test('the desktop grid uses distinct main/side column classes, and each section carries its own sizing modifier', () => {
  const { container } = render(<GovernancePanel trip={trip} capabilities={fullCapabilities} requests={[]} invitations={[]} bans={[]} onReview={jest.fn()} onInvite={jest.fn()} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  const main = container.querySelector('.governance-layout__main');
  const side = container.querySelector('.governance-layout__side');
  expect(main).toBeInTheDocument();
  expect(side).toBeInTheDocument();
  expect(main.querySelector('.gov-panel--requests')).toBeInTheDocument();
  expect(main.querySelector('.gov-panel--invitations')).toBeInTheDocument();
  expect(side.querySelector('.gov-panel--restricted')).toBeInTheDocument();
});
