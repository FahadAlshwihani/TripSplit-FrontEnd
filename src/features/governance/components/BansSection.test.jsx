import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BansSection from './BansSection';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));

test('never shows IP or "Unknown Device" as the ban subject -- identity is the member, always', () => {
  const bans = [{ id: 'b1', active: true, member: { display_name: 'Banned Guy', identity_type: 'guest', avatar: {} }, banned_by: { display_name: 'Owner' }, expires_at: null, reason: '' }];
  render(<BansSection bans={bans} onUnban={jest.fn()} canUnban />);
  expect(screen.getByText('Banned Guy')).toBeInTheDocument();
  expect(screen.queryByText(/unknown device/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/ip address/i)).not.toBeInTheDocument();
});

test('shows identity type, permanent label, banned-by, and reason for an authorized governance viewer', () => {
  const bans = [{ id: 'b1', active: true, member: { display_name: 'Banned Guy', identity_type: 'guest', avatar: {} }, banned_by: { display_name: 'Owner' }, expires_at: null, reason: 'Spamming the chat' }];
  render(<BansSection bans={bans} onUnban={jest.fn()} canUnban />);
  expect(screen.getByText('identity.guest', { exact: false })).toBeInTheDocument();
  expect(screen.getByText('governance.permanent', { exact: false })).toBeInTheDocument();
  expect(screen.getByText('governance.bannedBy:{"name":"Owner"}')).toBeInTheDocument();
  expect(screen.getByText('Spamming the chat')).toBeInTheDocument();
});

test('shows a temporary expiry date instead of "Permanent" when the ban has one', () => {
  const bans = [{ id: 'b1', active: true, member: { display_name: 'Temp Guy', identity_type: 'registered', avatar: {} }, banned_by: { display_name: 'Owner' }, expires_at: '2026-09-01T00:00:00Z', reason: '' }];
  render(<BansSection bans={bans} onUnban={jest.fn()} canUnban />);
  expect(screen.queryByText('governance.permanent')).not.toBeInTheDocument();
  expect(screen.getByText(/governance.temporaryUntil/)).toBeInTheDocument();
});

test('unban is a deliberate click that forwards the ban record', () => {
  const onUnban = jest.fn();
  const ban = { id: 'b1', active: true, member: { display_name: 'Banned Guy', identity_type: 'guest', avatar: {} }, banned_by: null, expires_at: null, reason: '' };
  render(<BansSection bans={[ban]} onUnban={onUnban} canUnban />);
  fireEvent.click(screen.getByText('governance.unban'));
  expect(onUnban).toHaveBeenCalledWith(ban);
});

test('only active bans render -- a revoked/expired ban is not shown as restricted', () => {
  const bans = [{ id: 'b1', active: false, member: { display_name: 'Was Banned', identity_type: 'guest', avatar: {} }, banned_by: null, expires_at: null, reason: '' }];
  render(<BansSection bans={bans} onUnban={jest.fn()} canUnban />);
  expect(screen.queryByText('Was Banned')).not.toBeInTheDocument();
  expect(screen.getByText('governance.noBans')).toBeInTheDocument();
});

test('the Unban action is hidden without the can_unban capability -- never a role guess', () => {
  const bans = [{ id: 'b1', active: true, member: { display_name: 'Banned Guy', identity_type: 'guest', avatar: {} }, banned_by: null, expires_at: null, reason: '' }];
  render(<BansSection bans={bans} onUnban={jest.fn()} canUnban={false} />);
  expect(screen.queryByText('governance.unban')).not.toBeInTheDocument();
});

test('an empty Restricted body carries the centering modifier class', () => {
  const { container } = render(<BansSection bans={[]} onUnban={jest.fn()} canUnban />);
  expect(container.querySelector('.gov-section-body--empty')).toBeInTheDocument();
});
