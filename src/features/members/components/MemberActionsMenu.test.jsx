import fs from 'fs';
import path from 'path';
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

const setViewport = (width, height = 768) => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};

afterEach(() => {
  document.documentElement.dir = 'ltr';
  setViewport(1024, 768);
});

test('anchors to the real trigger rect via position:fixed, not a hardcoded viewport offset', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  expect(panel.style.position).toBe('fixed');
  expect(panel.style.top).toBe('240px');
  expect(panel.style.left).toBe('500px');
});

test('LTR: a trigger comfortably inside the viewport keeps its preferred (left-anchored) position', () => {
  setViewport(1000);
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  expect(panel.style.left).toBe('500px');
});

test('RTL: a trigger comfortably inside the viewport keeps its preferred (right-anchored) position, expressed as a clamped left value', () => {
  document.documentElement.dir = 'rtl';
  setViewport(1000);
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 500, right: 536, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  // Preferred RTL anchor: panel's right edge meets the trigger's right
  // edge (536), so left = 536 - 200 (the width estimate) = 336 -- well
  // within [8, 1000-200-8], so no clamping was needed here.
  expect(panel.style.left).toBe('336px');
});

test('RTL viewport-collision fix: a trigger near the LEFT screen edge (its own preferred expansion direction) never pushes the menu off-screen', () => {
  document.documentElement.dir = 'rtl';
  setViewport(390); // a real mobile width
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  // Trigger sitting right at the physical left edge -- exactly the
  // real-world case from the bug report (RTL row actions live at the
  // row's inline-end, the physical left edge on a narrow phone).
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 4, right: 40, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  const left = parseFloat(panel.style.left);
  expect(left).toBeGreaterThanOrEqual(8); // never negative / off the left edge
  expect(left + 200).toBeLessThanOrEqual(390); // panel's right edge never exceeds the viewport
});

test('LTR viewport-collision fix: a trigger near the RIGHT screen edge never pushes the menu off-screen', () => {
  setViewport(390);
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  // Trigger sitting right at the physical right edge -- the LTR mirror
  // of the same real-world case (row actions live at the row's
  // inline-end, the physical right edge in LTR).
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 236, left: 350, right: 386, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  const left = parseFloat(panel.style.left);
  expect(left).toBeGreaterThanOrEqual(8);
  expect(left + 200).toBeLessThanOrEqual(390);
});

test('flips above the trigger when there is insufficient room below it (vertical collision)', () => {
  setViewport(1024, 300);
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'members.details Fahad' });
  trigger.getBoundingClientRect = jest.fn(() => ({ top: 260, bottom: 290, left: 20, right: 56, width: 36, height: 36 }));
  openMenu();
  const panel = screen.getByRole('menu', { name: 'members.details Fahad' });
  expect(panel.style.top).toBe('');
  expect(panel.style.bottom).toBe('44px'); // innerHeight - rect.top + 4
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

test('the panel is portal-mounted to document.body, never a descendant of an overflow:hidden ancestor', () => {
  const { container } = renderMenu();
  openMenu();
  const panel = screen.getByRole('menu');
  expect(container.contains(panel)).toBe(false);
  expect(document.body.contains(panel)).toBe(true);
});

test('only one menu panel is ever mounted at a time, even across repeated opens', () => {
  renderMenu();
  openMenu();
  expect(screen.getAllByRole('menu')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'members.details Fahad' })); // toggles closed
  expect(screen.queryAllByRole('menu')).toHaveLength(0);
  openMenu();
  expect(screen.getAllByRole('menu')).toHaveLength(1);
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

test('members.css caps the panel width to the viewport as a hard safety net under the JS clamp', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'members.css'), 'utf8');
  expect(css).toMatch(/\.member-actions-menu__panel\s*\{[^}]*max-inline-size:\s*calc\(100vw/);
});
