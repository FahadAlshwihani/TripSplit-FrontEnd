import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InviteMemberDialog from './InviteMemberDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const renderDialog = (overrides = {}) => render(
  <InviteMemberDialog onInvite={jest.fn().mockResolvedValue({})} onClose={jest.fn()} {...overrides} />,
);

test('sending an email invite calls onInvite with the email and then closes', async () => {
  const onInvite = jest.fn().mockResolvedValue({});
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(screen.getByLabelText('governance.inviteEmail'), { target: { value: 'friend@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'governance.sendInvite' }));
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({ email: 'friend@example.com' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

test('generating a guest link calls onInvite with no email and shows the resulting link, without closing', async () => {
  const onInvite = jest.fn().mockResolvedValue({ token: 'abc123' });
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.click(screen.getByRole('button', { name: 'governance.guestLink' }));
  await waitFor(() => expect(onInvite).toHaveBeenCalledWith({}));
  const linkField = await screen.findByLabelText('governance.copyOnce');
  expect(linkField.value).toContain('/invite/abc123');
  expect(onClose).not.toHaveBeenCalled();
});

test('a failed invite shows an error and keeps the dialog open', async () => {
  const onInvite = jest.fn().mockRejectedValue(new Error('nope'));
  const onClose = jest.fn();
  renderDialog({ onInvite, onClose });
  fireEvent.change(screen.getByLabelText('governance.inviteEmail'), { target: { value: 'friend@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'governance.sendInvite' }));
  expect(await screen.findByText('governance.inviteFailed')).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

test('close button calls onClose', () => {
  const onClose = jest.fn();
  renderDialog({ onClose });
  fireEvent.click(screen.getByText('common.close'));
  expect(onClose).toHaveBeenCalled();
});
