import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InviteMemberDialog from './InviteMemberDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderDialog = (overrides = {}) => render(
  <InviteMemberDialog onInvite={jest.fn().mockResolvedValue({})} onClose={jest.fn()} {...overrides} />,
);

const emailInput = () => screen.getByLabelText('governance.inviteEmail');
const submitBtn = () => screen.getByRole('button', { name: 'governance.sendInvite' });

test('the title and subtitle make clear this is an email invitation, not a name/username field', () => {
  renderDialog();
  expect(screen.getByText('governance.addMember')).toBeInTheDocument();
  expect(screen.getByText('governance.inviteSubtitle')).toBeInTheDocument();
});

test('the field label is explicitly Email, not a member-name label', () => {
  renderDialog();
  expect(screen.getByLabelText('governance.inviteEmail')).toBeInTheDocument();
});

test('the email field carries the correct type, direction, and input-mode contract', () => {
  renderDialog();
  const input = emailInput();
  expect(input).toHaveAttribute('type', 'email');
  expect(input).toHaveAttribute('dir', 'ltr');
  expect(input).toHaveAttribute('autocomplete', 'email');
  expect(input).toHaveAttribute('inputmode', 'email');
  expect(input).toHaveAttribute('placeholder', 'name@example.com');
});

test('surrounding whitespace is trimmed before onInvite is called', async () => {
  const onInvite = jest.fn().mockResolvedValue({});
  renderDialog({ onInvite });
  fireEvent.change(emailInput(), { target: { value: '  friend@example.com  ' } });
  fireEvent.click(submitBtn());
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: 'friend@example.com' }));
});

// The submit button is disabled for both empty and malformed input (see
// the "disabled while invalid" test below), so a click on it is
// correctly a no-op -- the inline error surfaces via blur instead,
// matching the real interaction a keyboard/mouse user actually has
// available against a disabled control.
test('leaving the email field empty shows the empty inline error on blur, and the button stays disabled so onInvite is never called', () => {
  const onInvite = jest.fn();
  renderDialog({ onInvite });
  fireEvent.focus(emailInput());
  fireEvent.blur(emailInput());
  expect(screen.getByText('governance.inviteErrorEmpty')).toBeInTheDocument();
  fireEvent.click(submitBtn());
  expect(onInvite).not.toHaveBeenCalled();
});

test.each(['abc', 'abc@', '@domain.com', 'abc domain@example.com'])('rejects the malformed email "%s" with an inline error on blur, and the disabled button never calls onInvite', (value) => {
  const onInvite = jest.fn();
  renderDialog({ onInvite });
  fireEvent.change(emailInput(), { target: { value } });
  fireEvent.blur(emailInput());
  expect(screen.getByText('governance.inviteErrorInvalid')).toBeInTheDocument();
  fireEvent.click(submitBtn());
  expect(onInvite).not.toHaveBeenCalled();
});

test.each(['fahad@example.com', 'name.surname+trip@example.co.uk'])('accepts the valid email "%s" and calls onInvite', async (value) => {
  const onInvite = jest.fn().mockResolvedValue({});
  renderDialog({ onInvite });
  fireEvent.change(emailInput(), { target: { value } });
  fireEvent.click(submitBtn());
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: value }));
});

test('sending an email invite calls onInvite with the email and then closes', async () => {
  const onInvite = jest.fn().mockResolvedValue({});
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: 'friend@example.com' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

test('a backend already_member error maps to the specific inline message, not the generic failure banner', async () => {
  const onInvite = jest.fn().mockRejectedValue({ code: 'already_member', message: 'already a member' });
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  expect(await screen.findByText('governance.inviteErrorAlreadyMember')).toBeInTheDocument();
  expect(screen.queryByText('governance.inviteFailed')).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

test('a backend email_banned error maps to the specific inline message', async () => {
  const onInvite = jest.fn().mockRejectedValue({ code: 'email_banned', message: 'banned' });
  renderDialog({ onInvite });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  expect(await screen.findByText('governance.inviteErrorBanned')).toBeInTheDocument();
});

test('an unrecognized backend error falls back to the generic failure message, and the entered email is preserved', async () => {
  const onInvite = jest.fn().mockRejectedValue(new Error('network down'));
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  expect(await screen.findByText('governance.inviteFailed')).toBeInTheDocument();
  expect(emailInput().value).toBe('friend@example.com');
  expect(onClose).not.toHaveBeenCalled();
});

test('the submit button is disabled while the email is empty or malformed', () => {
  renderDialog();
  expect(submitBtn()).toBeDisabled();
  fireEvent.change(emailInput(), { target: { value: 'not-an-email' } });
  expect(submitBtn()).toBeDisabled();
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  expect(submitBtn()).not.toBeDisabled();
});

test('double submit is prevented while a request is already in flight', async () => {
  let resolveInvite;
  const onInvite = jest.fn(() => new Promise((resolve) => { resolveInvite = resolve; }));
  renderDialog({ onInvite });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  fireEvent.click(submitBtn());
  fireEvent.click(submitBtn());
  expect(onInvite).toHaveBeenCalledTimes(1);
  resolveInvite({});
  await waitFor(() => {});
});

test('a successful invite refreshes the pending list via onInvite\'s own side effect (the caller awaits state.retry before resolving)', async () => {
  const calls = [];
  const onInvite = jest.fn(async (payload) => { calls.push(payload); return {}; });
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(calls).toEqual([{ email: 'friend@example.com' }]);
});

test('generating a guest link calls onInvite with no email and shows the resulting link, without closing -- a clearly separate alternative to email invite', async () => {
  const onInvite = jest.fn().mockResolvedValue({ token: 'abc123' });
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.click(screen.getByRole('button', { name: 'governance.guestLink' }));
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({}));
  const linkField = await screen.findByLabelText('governance.copyOnce');
  expect(linkField.value).toContain('/invite/abc123');
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByText('governance.or')).toBeInTheDocument();
});

test('a failed invite shows an error and keeps the dialog open', async () => {
  const onInvite = jest.fn().mockRejectedValue(new Error('nope'));
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(emailInput(), { target: { value: 'friend@example.com' } });
  fireEvent.click(submitBtn());
  expect(await screen.findByText('governance.inviteFailed')).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

test('close uses the canonical icon-button control, not a mismatched standalone footer button', () => {
  const onClose = jest.fn();
  const { container } = renderDialog({ onClose });
  const closeBtn = screen.getByRole('button', { name: 'common.close' });
  expect(closeBtn).toHaveClass('governance-dialog__close');
  fireEvent.click(closeBtn);
  expect(onClose).toHaveBeenCalled();
  // No redundant bottom "Close" button in the footer -- the top icon,
  // backdrop click, and Escape (via useModalDialog) are enough.
  expect(container.querySelector('.governance-dialog__footer')).toBeNull();
});

test('the email field is properly described for assistive tech: helper by default, error via aria-describedby once one exists', () => {
  renderDialog();
  const input = emailInput();
  expect(input).toHaveAttribute('aria-describedby', 'invite-email-helper');
  expect(input).not.toHaveAttribute('aria-invalid', 'true');
  fireEvent.blur(input);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-describedby', 'invite-email-error');
});
