import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MemberActionsMenu from './MemberActionsMenu';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const member = { id: 'm1', display_name: 'Fahad', capabilities: { can_promote: true, can_demote: false, can_remove: true, can_ban: false, can_transfer_ownership: false } };

const renderMenu = (props = {}) => render(
  <MemberActionsMenu
    member={member}
    label="members.details Fahad"
    onPromote={jest.fn()}
    onDemote={jest.fn()}
    onTransfer={jest.fn()}
    onRemove={jest.fn()}
    onBan={jest.fn()}
    onLeave={jest.fn()}
    {...props}
  />,
);

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'members.details Fahad' }));

afterEach(() => { document.documentElement.dir = 'ltr'; });

test('anchors to the real trigger rect via position:fixed, not a hardcoded viewport offset', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  expect(panel.style.position).toBe('fixed');
  expect(panel.style.top).toBe('240px');
  expect(panel.style.left).toBe('500px');
  expect(panel.style.right).toBe('');
});

test('anchors to the inline-end side under RTL, using the mirrored physical side', () => {
  document.documentElement.dir = 'rtl';
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  expect(panel.style.left).toBe('');
  expect(panel.style.right).toBe('464px');
});

test('Escape closes the menu and returns focus to the trigger', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  openMenu();
  expect(screen.getByRole('menu', { name: 'members.details Fahad' })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('clicking outside the panel closes it', () => {
  renderMenu();
  openMenu();
  expect(screen.getByRole('menu')).toBeInTheDocument();
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('only renders the actions the capabilities object grants', () => {
  renderMenu();
  openMenu();
  expect(screen.getByRole('menuitem', { name: 'members.promote' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'members.remove' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'members.demote' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'governance.confirmBanAction' })).not.toBeInTheDocument();
});

test('renders no trigger at all when there is nothing this viewer can do', () => {
  const noCapsMember = { id: 'm2', display_name: 'Nobody', capabilities: { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false } };
  renderMenu({ member: noCapsMember, label: 'members.details Nobody' });
  expect(screen.queryByRole('button', { name: 'members.details Nobody' })).not.toBeInTheDocument();
});

test('the self row always shows Leave and calls onLeave without triggering onRemove', () => {
  const onLeave = jest.fn();
  const onRemove = jest.fn();
  const self = { id: 'self', display_name: 'Me', isCurrentMember: true, capabilities: { can_promote: false, can_demote: false, can_remove: false, can_ban: false, can_transfer_ownership: false } };
  renderMenu({ member: self, label: 'members.details Me', onLeave, onRemove });
  fireEvent.click(screen.getByRole('button', { name: 'members.details Me' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'members.leave' }));
  expect(onLeave).toHaveBeenCalled();
  expect(onRemove).not.toHaveBeenCalled();
});
