import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripMoreActionsMenu from './TripMoreActionsMenu';

const renderMenu = (label = 'account.trips.moreActions') => render(
  <MemoryRouter>
    <TripMoreActionsMenu label={label}>
      {({ close }) => (
        <button type="button" onClick={close}>an action</button>
      )}
    </TripMoreActionsMenu>
  </MemoryRouter>
);

test('the trigger is an accessible, closed-by-default disclosure', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'account.trips.moreActions' });
  expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('clicking the trigger opens the popover, rendered onto document.body (not clipped by an ancestor)', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: 'account.trips.moreActions' }));
  const menu = screen.getByRole('menu');
  expect(menu).toBeInTheDocument();
  expect(menu.parentElement).toBe(document.body);
});

test('Escape closes the popover and returns focus to the trigger', () => {
  renderMenu();
  const trigger = screen.getByRole('button', { name: 'account.trips.moreActions' });
  fireEvent.click(trigger);
  expect(screen.getByRole('menu')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('an outside click closes the popover', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: 'account.trips.moreActions' }));
  expect(screen.getByRole('menu')).toBeInTheDocument();
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

test('selecting an action closes the popover via the provided close callback', () => {
  renderMenu();
  fireEvent.click(screen.getByRole('button', { name: 'account.trips.moreActions' }));
  fireEvent.click(screen.getByText('an action'));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
