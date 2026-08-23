import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MembersPanel from './MembersPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const permissions = { canManageMembers: false, canTransferOwnership: false };

test('a registered member with a DiceBear avatar renders the generated image, not the legacy avatar_01 glyph', async () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'dicebear', style: 'lorelei', seed: 'panel-test', animation: 'none' } }];
  const { container } = render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} permissions={permissions} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument(), { timeout: 15000 });
  expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/svg\+xml/));
}, 20000);

test('a registered member with an Initials avatar renders live initials on the chosen color', () => {
  const members = [{ id: 'm2', display_name: 'Sara Ahmed', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' } }];
  render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} permissions={permissions} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  expect(screen.getByText('SA')).toBeInTheDocument();
});

test('a guest member with a legacy avatar key still renders the emoji glyph', () => {
  const members = [{ id: 'm3', display_name: 'Guest', role: 'member', identity_type: 'guest', avatar: { type: 'legacy', key: 'avatar_01' } }];
  render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} permissions={permissions} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  expect(screen.getByText('🦊')).toBeInTheDocument();
});
