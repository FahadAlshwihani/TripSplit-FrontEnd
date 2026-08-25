import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MobileBottomNav from './MobileBottomNav';
import DashboardMoreSheet from './DashboardMoreSheet';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const Harness = ({ permissions = { canManageMembers: true } }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileBottomNav tripId="t1" onOpenMore={() => setOpen(true)} />
      {open && <DashboardMoreSheet tripId="t1" permissions={permissions} onClose={() => setOpen(false)} />}
    </>
  );
};

const renderHarness = (permissions) => render(
  <MemoryRouter initialEntries={['/trips/t1/overview']}>
    <Routes>
      <Route path="/trips/:tripId/*" element={<Harness permissions={permissions} />} />
    </Routes>
  </MemoryRouter>,
);

test('the bottom nav exposes exactly the three default favorites plus More -- not every destination', () => {
  renderHarness();
  const labels = screen.getAllByRole('link').map((link) => link.textContent).concat(screen.getByRole('button', { name: 'dashboard.more' }).textContent);
  expect(labels).toEqual(['dashboard.nav.overview', 'dashboard.nav.expenses', 'dashboard.nav.fund', 'dashboard.more']);
});

test('More opens a sheet exposing everything not already a favorite: Balances, Members, Activity, Settlements, Settings, and Support', () => {
  renderHarness({ canManageMembers: false });
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  const sheet = screen.getByRole('dialog');
  expect(sheet).toHaveTextContent('dashboard.nav.balances');
  expect(sheet).toHaveTextContent('dashboard.nav.members');
  expect(sheet).toHaveTextContent('dashboard.nav.activity');
  expect(sheet).toHaveTextContent('dashboard.nav.settlements');
  expect(sheet).toHaveTextContent('dashboard.nav.settings');
  expect(sheet).toHaveTextContent('dashboard.nav.support');
  // The three favorites never appear twice.
  expect(sheet).not.toHaveTextContent('dashboard.nav.overview');
  expect(sheet).not.toHaveTextContent('dashboard.nav.expenses');
  expect(sheet).not.toHaveTextContent('dashboard.nav.fund');
});

test('the sheet has a visible, accessible heading', () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  expect(screen.getByRole('heading', { name: 'dashboard.more' })).toBeInTheDocument();
});

test('Governance only appears in the More sheet for a member with canManageMembers', () => {
  renderHarness({ canManageMembers: false });
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  expect(screen.queryByText('dashboard.nav.governance')).not.toBeInTheDocument();
});

test('Escape closes the More sheet', () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('clicking outside the sheet closes it', () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  fireEvent.click(document.querySelector('.dash-more-overlay'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('opening the sheet moves keyboard focus into it (the first destination link)', () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  const firstSheetLink = screen.getByRole('dialog').querySelector('a');
  expect(firstSheetLink).toHaveFocus();
});

test('the sheet renders through a portal to document.body, not nested under the bottom nav', () => {
  renderHarness();
  fireEvent.click(screen.getByRole('button', { name: 'dashboard.more' }));
  const sheet = screen.getByRole('dialog');
  expect(sheet.closest('.dash-bottom-nav')).toBeNull();
});
