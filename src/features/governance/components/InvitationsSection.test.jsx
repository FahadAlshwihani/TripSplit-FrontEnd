import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InvitationsSection from './InvitationsSection';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));

const emailInvite = { id: 'i1', email: 'ahmed@example.com', invited_by: { display_name: 'You' }, created_at: '2026-08-28T00:00:00Z', accepted_at: null, revoked_at: null };
const guestInvite = { id: 'i2', email: null, invited_by: { display_name: 'Saud' }, created_at: '2026-08-25T00:00:00Z', accepted_at: null, revoked_at: null };
const acceptedInvite = { id: 'i3', email: 'done@example.com', invited_by: { display_name: 'You' }, created_at: '2026-08-20T00:00:00Z', accepted_at: '2026-08-21T00:00:00Z', revoked_at: null };

test('an invited email renders isolated for LTR even under an RTL page', () => {
  render(<InvitationsSection invitations={[emailInvite]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  const email = screen.getByText('ahmed@example.com');
  expect(email.tagName.toLowerCase()).toBe('bdi');
  expect(email).toHaveAttribute('dir', 'ltr');
});

test('a guest link invitation shows a generic label instead of a fabricated email', () => {
  render(<InvitationsSection invitations={[guestInvite]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(screen.getByText('governance.guestInvite')).toBeInTheDocument();
  expect(screen.queryByText('governance.resend')).not.toBeInTheDocument();
});

test('accepted/revoked invitations are excluded from the pending list', () => {
  render(<InvitationsSection invitations={[emailInvite, acceptedInvite]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(screen.getByText('ahmed@example.com')).toBeInTheDocument();
  expect(screen.queryByText('done@example.com')).not.toBeInTheDocument();
});

test('resend and revoke call their handlers with the invitation row', () => {
  const onResend = jest.fn();
  const onRevoke = jest.fn();
  render(<InvitationsSection invitations={[emailInvite]} onOpenInvite={jest.fn()} onResend={onResend} onRevoke={onRevoke} canInvite canResend canRevoke />);
  fireEvent.click(screen.getByText(/governance.resend/));
  expect(onResend).toHaveBeenCalledWith(emailInvite);
  fireEvent.click(screen.getByText('governance.revoke'));
  expect(onRevoke).toHaveBeenCalledWith(emailInvite);
});

test('without capabilities, Invite/Resend/Revoke never render -- never a role guess', () => {
  render(<InvitationsSection invitations={[emailInvite]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite={false} canResend={false} canRevoke={false} />);
  expect(screen.queryByText('governance.addMember')).not.toBeInTheDocument();
  expect(screen.queryByText(/governance.resend/)).not.toBeInTheDocument();
  expect(screen.queryByText('governance.revoke')).not.toBeInTheDocument();
});

test('the section icon uses the neutral (not primary-blue) treatment, distinct from Join Requests', () => {
  const { container } = render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(container.querySelector('.gov-section-head__title--neutral')).toBeInTheDocument();
});

test('empty state shows a real message when there are no pending invitations', () => {
  render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(screen.getByText('governance.noInvitations')).toBeInTheDocument();
});

test('an empty body carries the centering modifier class, and the Invite action stays visible in the header regardless', () => {
  const { container } = render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(container.querySelector('.gov-section-body--empty')).toBeInTheDocument();
  expect(screen.getByText('governance.addMember')).toBeInTheDocument();
});
