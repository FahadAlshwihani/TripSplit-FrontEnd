import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MembersPanel from './MembersPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
// MembersPanel builds its own navigation link from trip.short_code
// (via useOutletContext) rather than a tripId prop -- see TripLayout's
// own comment on why.
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useOutletContext: () => ({ trip: { short_code: 't1' } }) }));

const noCaps = { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false, can_settle_with: false };

const renderPanel = (members, overrides = {}) => render(
  <MemoryRouter>
    <MembersPanel
      members={members}
      currentMember={{ id: 'self', role: 'member' }}
      currency="SAR"
      tripId="t1"
      selectedId={null}
      onSelect={jest.fn()}
      balancesByMemberId={{}}
      onRole={jest.fn()}
      onRemove={jest.fn()}
      onTransfer={jest.fn()}
      onLeave={jest.fn()}
      onBan={jest.fn()}
      {...overrides}
    />
  </MemoryRouter>,
);

const openMenuFor = (name) => fireEvent.click(screen.getByRole('button', { name: `members.details ${name}` }));

test('the Add action only renders when the viewer has the capability, and links into Governance', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: {}, capabilities: noCaps }];
  const { rerender } = renderPanel(members, { canInvite: false });
  expect(screen.queryByText('members.addAction')).not.toBeInTheDocument();
  rerender(
    <MemoryRouter>
      <MembersPanel
        members={members}
        currentMember={{ id: 'self', role: 'member' }}
        currency="SAR"
        tripId="t1"
        canInvite
        selectedId={null}
        onSelect={jest.fn()}
        balancesByMemberId={{}}
        onRole={jest.fn()}
        onRemove={jest.fn()}
        onTransfer={jest.fn()}
        onLeave={jest.fn()}
        onBan={jest.fn()}
      />
    </MemoryRouter>,
  );
  const addLink = screen.getByText('members.addAction').closest('a');
  expect(addLink).toHaveAttribute('href', '/trips/t1/governance');
});

test('search and the historical-members toggle share one toolbar, not a loose setting above search', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: {}, capabilities: noCaps }];
  renderPanel(members, { showHistorical: false, onToggleHistorical: jest.fn() });
  const search = screen.getByPlaceholderText('members.searchPlaceholder');
  const toggle = screen.getByText('members.showHistorical').closest('label');
  const toolbar = search.closest('.mem-toolbar');
  expect(toolbar).not.toBeNull();
  expect(toolbar).toContainElement(toggle);
});

test('row layout contract: identity block and action menu are stretched siblings of one row container, not independently-centered floating elements', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: {}, capabilities: { ...noCaps, can_remove: true } }];
  renderPanel(members);
  const li = screen.getByText('Fahad').closest('li');
  const row = li.querySelector('.mem-row');
  const actions = li.querySelector('.member-actions-menu');
  expect(row).not.toBeNull();
  expect(actions).not.toBeNull();
  // Both are direct children of the same <li>, so the CSS contract
  // (`.mem-list__rows > li { align-items: stretch }` +
  // `.member-actions-menu { align-items: center }`) applies to both
  // identically -- there is no separate sizing/positioning system for
  // either one.
  expect(row.parentElement).toBe(li);
  expect(actions.parentElement).toBe(li);
});

test('the historical toggle uses the canonical switch component, not a raw checkbox', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: {}, capabilities: noCaps }];
  renderPanel(members, { showHistorical: false, onToggleHistorical: jest.fn() });
  const toggle = screen.getByText('members.showHistorical').closest('label');
  expect(toggle.querySelector('.acc-switch')).not.toBeNull();
});

describe('role carries more visual weight than identity', () => {
  test('owner and admin get the emphasized role badge treatment, plain member does not', () => {
    const members = [
      { id: 'o1', display_name: 'Owner', role: 'owner', identity_type: 'registered', avatar: {}, capabilities: noCaps },
      { id: 'a1', display_name: 'Admin', role: 'admin', identity_type: 'registered', avatar: {}, capabilities: noCaps },
      { id: 'm1', display_name: 'Member', role: 'member', identity_type: 'registered', avatar: {}, capabilities: noCaps },
    ];
    renderPanel(members);
    expect(screen.getByText('role.owner')).toHaveClass('mem-badge--role-owner');
    expect(screen.getByText('role.admin')).toHaveClass('mem-badge--role-admin');
    expect(screen.getByText('role.member')).toHaveClass('mem-badge--role-member');
    // Identity is always plain muted text alongside the joined date --
    // never its own badge box competing with the role badge's weight.
    expect(screen.getAllByText(/identity\.registered/)[0]).not.toHaveClass('mem-badge');
  });

  test('an inactive (historical) row gets a distinct muted badge', () => {
    const members = [{ id: 'm1', display_name: 'Gone', role: 'member', identity_type: 'registered', active: false, avatar: {}, capabilities: noCaps }];
    renderPanel(members);
    expect(screen.getByText('members.inactive')).toHaveClass('mem-badge--inactive');
  });
});

test('a selected row is marked with the dedicated selected class, not shadow alone', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: {}, capabilities: noCaps }];
  renderPanel(members, { selectedId: 'm1' });
  expect(screen.getByText('Fahad').closest('.mem-row')).toHaveClass('mem-row--selected');
});

test('a registered member with a DiceBear avatar renders the generated image, not the legacy avatar_01 glyph', async () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'dicebear', style: 'lorelei', seed: 'panel-test', animation: 'none' }, capabilities: noCaps }];
  const { container } = renderPanel(members);
  await waitFor(() => expect(container.querySelector('img')).toBeInTheDocument(), { timeout: 15000 });
  expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^data:image\/svg\+xml/));
}, 20000);

test('a registered member with an Initials avatar renders live initials on the chosen color', () => {
  const members = [{ id: 'm2', display_name: 'Sara Ahmed', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps }];
  renderPanel(members);
  expect(screen.getByText('SA')).toBeInTheDocument();
});

test('a guest member with a legacy avatar key still renders the emoji glyph', () => {
  const members = [{ id: 'm3', display_name: 'Guest', role: 'member', identity_type: 'guest', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: noCaps }];
  renderPanel(members);
  expect(screen.getByText('🦊')).toBeInTheDocument();
});

test('clicking a row calls onSelect with that member', () => {
  const onSelect = jest.fn();
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps }];
  renderPanel(members, { onSelect });
  fireEvent.click(screen.getByText('Fahad'));
  expect(onSelect).toHaveBeenCalledWith(members[0]);
});

test('the selected row is marked aria-current, others are not', () => {
  const members = [
    { id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps },
    { id: 'm2', display_name: 'Sara', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps },
  ];
  renderPanel(members, { selectedId: 'm2' });
  expect(screen.getByText('Fahad').closest('button')).toHaveAttribute('aria-current', 'false');
  expect(screen.getByText('Sara').closest('button')).toHaveAttribute('aria-current', 'true');
});

test('a row balance renders via the canonical Money component from balancesByMemberId, not recomputed', () => {
  const members = [{ id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps }];
  renderPanel(members, { balancesByMemberId: { m1: '85.00' } });
  const money = screen.getByText((_, node) => node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === '85.00 SAR');
  expect(money).toBeInTheDocument();
});

test('search filters the list by display name', () => {
  const members = [
    { id: 'm1', display_name: 'Fahad', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps },
    { id: 'm2', display_name: 'Sara', role: 'member', identity_type: 'registered', avatar: { type: 'initials', color: 'sage' }, capabilities: noCaps },
  ];
  renderPanel(members);
  fireEvent.change(screen.getByPlaceholderText('members.searchPlaceholder'), { target: { value: 'sar' } });
  expect(screen.getByText('Sara')).toBeInTheDocument();
  expect(screen.queryByText('Fahad')).not.toBeInTheDocument();
});

describe('server-derived capabilities gate every row action', () => {
  const admin = { id: 'peer-admin', display_name: 'Peer Admin', role: 'admin', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: noCaps };

  test('a member with no capabilities renders no action menu at all -- never a role guess', () => {
    renderPanel([admin]);
    expect(screen.queryByRole('button', { name: 'members.details Peer Admin' })).not.toBeInTheDocument();
  });

  test('can_promote renders Promote in the row menu and calls onRole with the admin role', () => {
    const onRole = jest.fn();
    const member = { id: 'm4', display_name: 'Regular', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: { ...noCaps, can_promote: true } };
    renderPanel([member], { onRole });
    openMenuFor('Regular');
    fireEvent.click(screen.getByRole('menuitem', { name: 'members.promote' }));
    expect(onRole).toHaveBeenCalledWith(member, 'admin');
  });

  test('can_remove renders Remove in the row menu and calls onRemove with the member', () => {
    const onRemove = jest.fn();
    const member = { id: 'm5', display_name: 'Removable', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: { ...noCaps, can_remove: true } };
    renderPanel([member], { onRemove });
    openMenuFor('Removable');
    fireEvent.click(screen.getByRole('menuitem', { name: 'members.remove' }));
    expect(onRemove).toHaveBeenCalledWith(member);
  });

  test('can_ban renders Ban in the row menu and calls onBan with the member', () => {
    const onBan = jest.fn();
    const member = { id: 'm6', display_name: 'Bannable', role: 'member', identity_type: 'guest', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: { ...noCaps, can_ban: true } };
    renderPanel([member], { onBan });
    openMenuFor('Bannable');
    fireEvent.click(screen.getByRole('menuitem', { name: 'governance.confirmBanAction' }));
    expect(onBan).toHaveBeenCalledWith(member);
  });

  test('the current member always sees Leave in their own row menu regardless of capabilities', () => {
    const onLeave = jest.fn();
    const self = { id: 'self', display_name: 'Me', role: 'member', identity_type: 'registered', avatar: { type: 'legacy', key: 'avatar_01' }, capabilities: noCaps };
    renderPanel([self], { onLeave });
    openMenuFor('Me');
    fireEvent.click(screen.getByRole('menuitem', { name: 'members.leave' }));
    expect(onLeave).toHaveBeenCalled();
  });
});
