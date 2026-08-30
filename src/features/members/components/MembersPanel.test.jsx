import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MembersPanel from './MembersPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_transfer_ownership: false, can_settle_with: false };

test('a registered member with a DiceBear avatar renders the generated image, not the legacy avatar_01 glyph', async () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'dicebear', style: 'lorelei', seed: 'panel-test', animation: 'none' }, capabilities: noCaps }];
  const { container } = render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument(), { timeout: 15000 });
  expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/svg\+xml/));
}, 20000);

test('a registered member with an Initials avatar renders live initials on the chosen color', () => {
  const members = [{ id: 'm2', display_name: 'Sara Ahmed', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps }];
  render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  expect(screen.getByText('SA')).toBeInTheDocument();
});

test('a guest member with a legacy avatar key still renders the emoji glyph', () => {
  const members = [{ id: 'm3', display_name: 'Guest', role: 'member', identity_type: 'guest', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: noCaps }];
  render(
    <MembersPanel members={members} currentMember={{ role: 'member' }} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />,
  );
  expect(screen.getByText('🦊')).toBeInTheDocument();
});

describe('server-derived capabilities gate every row action', () => {
  const admin = { id: 'peer-admin', display_name: 'Peer Admin', role: 'admin', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: noCaps };

  test('a member with no capabilities renders no action buttons at all -- never a role guess', () => {
    render(<MembersPanel members={[admin]} currentMember={{ role: 'admin' }} onRole={jest.fn()} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />);
    expect(screen.queryByText('members.remove')).not.toBeInTheDocument();
    expect(screen.queryByText('members.promote')).not.toBeInTheDocument();
  });

  test('can_promote renders Promote and calls onRole with the admin role', () => {
    const onRole = jest.fn();
    const member = { id: 'm4', display_name: 'Regular', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: { ...noCaps, can_promote: true } };
    render(<MembersPanel members={[member]} currentMember={{ role: 'owner' }} onRole={onRole} onRemove={jest.fn()} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />);
    fireEvent.click(screen.getByText('members.promote'));
    expect(onRole).toHaveBeenCalledWith(member, 'admin');
  });

  test('can_remove renders Remove and calls onRemove with the member', () => {
    const onRemove = jest.fn();
    const member = { id: 'm5', display_name: 'Removable', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: { ...noCaps, can_remove: true } };
    render(<MembersPanel members={[member]} currentMember={{ role: 'owner' }} onRole={jest.fn()} onRemove={onRemove} onTransfer={jest.fn()} onLeave={jest.fn()} onDetails={jest.fn()} />);
    fireEvent.click(screen.getByText('members.remove'));
    expect(onRemove).toHaveBeenCalledWith(member);
  });
});
