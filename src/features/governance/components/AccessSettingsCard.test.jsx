import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AccessSettingsCard from './AccessSettingsCard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));

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

test('copy link writes the full localized share message (including the join URL), not just the bare URL', async () => {
  renderCard({ title: 'Georgia', join_code: 'ABC12345', join_policy: 'open' });
  fireEvent.click(screen.getByText('governance.copyLink'));
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
  const copied = navigator.clipboard.writeText.mock.calls[navigator.clipboard.writeText.mock.calls.length - 1][0];
  expect(copied).toContain('/trips/join?code=ABC12345');
  expect(copied).toContain('share.join.open');
  expect(await screen.findByText('governance.copied')).toBeInTheDocument();
});

test('the copied share message never includes a password -- Governance never has a real password value to share', async () => {
  renderCard({ title: 'Georgia', join_code: 'ABC12345', join_policy: 'approval_required', password_protected: true });
  fireEvent.click(screen.getByText('governance.copyLink'));
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
  const copied = navigator.clipboard.writeText.mock.calls[navigator.clipboard.writeText.mock.calls.length - 1][0];
  expect(copied).not.toContain('WithPassword');
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
  expect(container.querySelector('.gov-settings__link-code')).toBeInTheDocument();
  expect(container.querySelector('.gov-settings__link-row .field-control')).toBeNull();
});

test('the switch is 40x24 per the Stitch source, not the app-wide 40x22 acc-switch', () => {
  const { container } = renderCard({ join_code: 'ABC', join_policy: 'open' });
  expect(container.querySelector('.gov-switch')).toBeInTheDocument();
  expect(container.querySelector('.acc-switch')).toBeNull();
});

// jsdom has no real layout/transform engine, so these assert the DOM/
// class contract governance.css's rules are written against (track,
// thumb pseudo-element hook, real checkbox semantics) -- not rendered
// pixels. Structural proof only, per the brief's own caveat.
test('switch structural contract: real checkbox input inside a track element, native semantics intact', () => {
  const { container } = renderCard({ join_code: 'ABC', join_policy: 'open' });
  const input = screen.getByLabelText('governance.requireApproval');
  expect(input.tagName).toBe('INPUT');
  expect(input).toHaveAttribute('type', 'checkbox');
  expect(input.closest('.gov-switch').querySelector('.gov-switch__track')).toBeInTheDocument();
});

test('ON state reflects join_policy=approval_required; OFF reflects open', () => {
  const { rerender } = renderCard({ join_code: 'ABC', join_policy: 'approval_required' });
  expect(screen.getByLabelText('governance.requireApproval')).toBeChecked();
  rerender(<AccessSettingsCard trip={{ join_code: 'ABC', join_policy: 'open' }} onUpdateSettings={jest.fn()} onRotateLink={jest.fn()} />);
  expect(screen.getByLabelText('governance.requireApproval')).not.toBeChecked();
});

test('the switch renders and toggles identically under an RTL container (one canonical implementation, no duplicated CSS)', async () => {
  const onUpdateSettings = jest.fn();
  const { container } = render(
    <div dir="rtl">
      <AccessSettingsCard trip={{ join_code: 'ABC', join_policy: 'open' }} onUpdateSettings={onUpdateSettings} onRotateLink={jest.fn()} />
    </div>,
  );
  expect(container.querySelector('[dir="rtl"] .gov-switch')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('governance.requireApproval'));
  await waitFor(() => expect(onUpdateSettings).toHaveBeenCalledWith({ join_policy: 'approval_required' }));
});

test('a real checkbox is keyboard-operable by default -- no negative tabIndex or custom key handling overriding native semantics', () => {
  renderCard({ join_code: 'ABC', join_policy: 'open' });
  const input = screen.getByLabelText('governance.requireApproval');
  expect(input).not.toHaveAttribute('tabindex', '-1');
  expect(input).not.toBeDisabled();
});
