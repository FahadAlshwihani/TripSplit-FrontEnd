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

test('the section icon uses the neutral (secondary) treatment, distinct from Join Requests\' primary icon', () => {
  const { container } = render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(container.querySelector('.gov-section-head__icon--neutral')).toBeInTheDocument();
});

test('renders the exact Stitch icon names (mail, add) via Material Symbols, not substitute glyphs', () => {
  const { container } = render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  const icons = Array.from(container.querySelectorAll('.material-symbols-outlined')).map((el) => el.textContent);
  expect(icons).toEqual(expect.arrayContaining(['mail', 'add']));
  expect(container.querySelector('.bi')).toBeNull();
});

test('the resend icon is the exact Stitch "send" glyph', () => {
  const { container } = render(<InvitationsSection invitations={[{ id: 'i1', email: 'a@b.com', invited_by: { display_name: 'You' }, created_at: '2026-08-28T00:00:00Z', accepted_at: null, revoked_at: null }]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  const icons = Array.from(container.querySelectorAll('.material-symbols-outlined')).map((el) => el.textContent);
  expect(icons).toContain('send');
});

test('invitation row actions use the Stitch-ported .gov-btn, not the app-wide .dash-btn', () => {
  const { container } = render(<InvitationsSection invitations={[emailInvite]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(container.querySelectorAll('.gov-btn').length).toBe(2);
  expect(container.querySelector('.dash-btn')).toBeNull();
});

test('empty state shows a real message inside the same bordered box a populated list would use', () => {
  const { container } = render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(screen.getByText('governance.noInvitations')).toBeInTheDocument();
  expect(container.querySelector('.gov-list--empty')).toBeInTheDocument();
});

test('the Invite action stays visible in the header even when the list is empty', () => {
  render(<InvitationsSection invitations={[]} onOpenInvite={jest.fn()} onResend={jest.fn()} onRevoke={jest.fn()} canInvite canResend canRevoke />);
  expect(screen.getByText('governance.addMember')).toBeInTheDocument();
});
