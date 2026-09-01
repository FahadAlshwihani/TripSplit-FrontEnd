import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AccessSettingsCard from './AccessSettingsCard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });

const renderCard = (trip, overrides = {}) => render(
  <AccessSettingsCard trip={trip} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} {...overrides} />,
);

test('open + no approval renders both toggles unchecked', () => {
  renderCard({ join_code: 'ABC', join_policy: 'open' });
  expect(screen.getByLabelText('governance.requireApproval')).not.toBeChecked();
  expect(screen.getByLabelText('governance.inviteLinkActive')).toBeChecked();
});

test('approval_required checks both toggles', () => {
  renderCard({ join_code: 'ABC', join_policy: 'approval_required' });
  expect(screen.getByLabelText('governance.requireApproval')).toBeChecked();
  expect(screen.getByLabelText('governance.inviteLinkActive')).toBeChecked();
});

test('invite_only unchecks the link toggle and disables the approval toggle', () => {
  renderCard({ join_code: 'ABC', join_policy: 'invite_only' });
  expect(screen.getByLabelText('governance.inviteLinkActive')).not.toBeChecked();
  expect(screen.getByLabelText('governance.requireApproval')).toBeDisabled();
});

test('turning approval on while the link is already active keeps the link on', async () => {
  const onUpdateSettings = jest.fn();
  renderCard({ join_code: 'ABC', join_policy: 'open' }, { onUpdateSettings });
  fireEvent.click(screen.getByLabelText('governance.requireApproval'));
  await waitFor(() => expect(onUpdateSettings).toHaveBeenCalledWith({ join_policy: 'approval_required' }));
});

test('turning approval off while the link is active goes back to open', async () => {
  const onUpdateSettings = jest.fn();
  renderCard({ join_code: 'ABC', join_policy: 'approval_required' }, { onUpdateSettings });
  fireEvent.click(screen.getByLabelText('governance.requireApproval'));
  await waitFor(() => expect(onUpdateSettings).toHaveBeenCalledWith({ join_policy: 'open' }));
});

test('copy link writes the shareable join URL to the clipboard', async () => {
  renderCard({ join_code: 'ABC12345', join_policy: 'open' });
  fireEvent.click(screen.getByText('governance.copyLink'));
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/trips/join?code=ABC12345')));
  expect(await screen.findByText('governance.copied')).toBeInTheDocument();
});

test('rotate link requires confirmation before calling the API', async () => {
  const onRotateLink = jest.fn();
  renderCard({ join_code: 'ABC', join_policy: 'open' }, { onRotateLink });
  fireEvent.click(screen.getByText('governance.rotateLink'));
  expect(onRotateLink).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'governance.rotateLink' }));
  await waitFor(() => expect(onRotateLink).toHaveBeenCalled());
});

test('without can_manage_approval_setting the approval toggle is disabled -- never a role guess', () => {
  const capabilities = { can_manage_approval_setting: false, can_manage_invite_link: true };
  renderCard({ join_code: 'ABC', join_policy: 'open' }, { capabilities });
  expect(screen.getByLabelText('governance.requireApproval')).toBeDisabled();
});

test('without can_manage_invite_link the link toggle is disabled and copy/rotate are hidden', () => {
  const capabilities = { can_manage_approval_setting: true, can_manage_invite_link: false };
  renderCard({ join_code: 'ABC', join_policy: 'open' }, { capabilities });
  expect(screen.getByLabelText('governance.inviteLinkActive')).toBeDisabled();
  expect(screen.queryByText('governance.copyLink')).not.toBeInTheDocument();
  expect(screen.queryByText('governance.rotateLink')).not.toBeInTheDocument();
});

test('the invite link uses the compact secondary layout, not the full-size field-control input', () => {
  const { container } = renderCard({ join_code: 'ABC12345', join_policy: 'open' });
  expect(container.querySelector('.governance-settings__link-input')).toBeInTheDocument();
  expect(container.querySelector('.governance-settings__link-row .field-control')).toBeNull();
});
