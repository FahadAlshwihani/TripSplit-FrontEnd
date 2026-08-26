import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import SettlementsPage from './SettlementsPage';
import { getSettlements, getSettlementTimeline, recordAdminSettlement, reviewSettlement } from '../api/settlementsApi';
import { getMembers } from '../../members/api/membersApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));
jest.mock('../api/settlementsApi', () => ({
  getSettlements: jest.fn(),
  getSettlementTimeline: jest.fn(),
  reviewSettlement: jest.fn(),
  recordAdminSettlement: jest.fn(),
}));
jest.mock('../../members/api/membersApi', () => ({ getMembers: jest.fn() }));

const fahad = { id: 'm1', display_name: 'Fahad', role: 'owner', active: true, avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', role: 'member', active: true, avatar: { type: 'initials', color: 'slate' } };

const pendingRow = { id: 's1', from_member_id: 'm2', from_name: 'Saud', to_member_id: 'm1', to_name: 'Fahad', amount: '75.00', currency: 'SAR', status: 'pending', settlement_date: '2026-08-20', note: '', created_by: 'm2' };
const confirmedRow = { id: 's2', from_member_id: 'm1', from_name: 'Fahad', to_member_id: 'm2', to_name: 'Saud', amount: '30.00', currency: 'SAR', status: 'confirmed', settlement_date: '2026-08-10', note: '', created_by: 'm1' };

const permissions = { canRecordSettlement: true };
const trip = { currency: 'SAR' };

const renderPage = (ctxOverrides = {}) => render(
  <MemoryRouter initialEntries={['/trips/t1/settlements']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', currentMember: fahad, permissions, ...ctxOverrides }} />}>
        <Route path="settlements" element={<SettlementsPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getSettlements.mockResolvedValue({ results: [pendingRow, confirmedRow] });
  getMembers.mockResolvedValue({ results: [fahad, saud] });
  getSettlementTimeline.mockResolvedValue([]);
});

test('renders both settlement rows with their status badges', async () => {
  renderPage();
  expect(await screen.findByText('Saud → Fahad')).toBeInTheDocument();
  expect(screen.getByText('Fahad → Saud')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.pending')).toBeInTheDocument();
  expect(screen.getByText('settlements.status.confirmed')).toBeInTheDocument();
});

test('the status filter narrows the visible rows', async () => {
  renderPage();
  await screen.findByText('Saud → Fahad');
  fireEvent.click(screen.getByRole('radio', { name: 'settlements.filter.confirmed' }));
  expect(screen.queryByText('Saud → Fahad')).not.toBeInTheDocument();
  expect(screen.getByText('Fahad → Saud')).toBeInTheDocument();
});

test('clicking a row opens the timeline drawer and fetches its history', async () => {
  renderPage();
  fireEvent.click(await screen.findByText('Saud → Fahad'));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  await waitFor(() => expect(getSettlementTimeline).toHaveBeenCalledWith('t1', 's1', expect.anything()));
});

test('the recipient (owner) can confirm a pending row inline from the ledger', async () => {
  reviewSettlement.mockResolvedValue({});
  renderPage();
  await screen.findByText('Saud → Fahad');
  fireEvent.click(screen.getByRole('button', { name: 'settlements.yesReceived' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's1', 'confirm'));
});

test('a plain member who is neither party nor a manager gets no inline review buttons', async () => {
  const third = { id: 'm3', display_name: 'Mohammed', role: 'member', active: true };
  renderPage({ currentMember: third });
  await screen.findByText('Saud → Fahad');
  expect(screen.queryByRole('button', { name: 'settlements.yesReceived' })).not.toBeInTheDocument();
});

test('the reporter can withdraw their own pending row', async () => {
  reviewSettlement.mockResolvedValue({});
  renderPage({ currentMember: saud });
  await screen.findByText('Saud → Fahad');
  fireEvent.click(screen.getByRole('button', { name: 'settlements.withdrawReport' }));
  await waitFor(() => expect(reviewSettlement).toHaveBeenCalledWith('t1', 's1', 'cancel'));
});

test('an owner sees Record External Settlement and can submit an acknowledged admin settlement', async () => {
  recordAdminSettlement.mockResolvedValue({});
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'settlements.recordExternal' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('settlements.payer'), { target: { value: 'm2' } });
  fireEvent.change(within(dialog).getByLabelText('settlements.recipient'), { target: { value: 'm1' } });
  fireEvent.change(within(dialog).getByLabelText('expense.amount'), { target: { value: '15' } });
  fireEvent.click(within(dialog).getByRole('checkbox'));
  fireEvent.click(within(dialog).getByRole('button', { name: 'settlements.recordExternal' }));
  await waitFor(() => expect(recordAdminSettlement).toHaveBeenCalledWith('t1', expect.objectContaining({ acknowledged: true })));
});

test('a regular member never sees Record External Settlement', async () => {
  renderPage({ currentMember: saud });
  await screen.findByText('Saud → Fahad');
  expect(screen.queryByRole('button', { name: 'settlements.recordExternal' })).not.toBeInTheDocument();
});

test('a read-only (archived) trip hides all inline review actions', async () => {
  renderPage({ permissions: { canRecordSettlement: false } });
  await screen.findByText('Saud → Fahad');
  expect(screen.queryByRole('button', { name: 'settlements.yesReceived' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settlements.recordExternal' })).not.toBeInTheDocument();
});

test('an empty ledger shows the empty state', async () => {
  getSettlements.mockResolvedValue({ results: [] });
  renderPage();
  expect(await screen.findByText('settlements.empty')).toBeInTheDocument();
});

test('a load failure shows a retry action', async () => {
  getSettlements.mockRejectedValue(new Error('network down'));
  renderPage();
  expect(await screen.findByText('network down')).toBeInTheDocument();
});
