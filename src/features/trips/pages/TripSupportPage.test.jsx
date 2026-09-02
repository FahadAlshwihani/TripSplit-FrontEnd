import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripSupportPage from './TripSupportPage';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: { display_name: 'Fahad', email: 'fahad@example.com' }, isAuthenticated: true, authLoading: false }) }));
jest.mock('../../support/api/supportApi', () => ({ createSupportTicket: jest.fn(() => new Promise(() => {})) }));

const ctx = { tripId: 'trip-uuid-1', currentMember: { display_name: 'Fahad', avatar: {} } };

const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/short-1/support']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={ctx} />}>
        <Route path="support" element={<TripSupportPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

test('renders the Stitch structure: title, Direct Assistance, Knowledge Base', () => {
  renderPage();
  expect(screen.getByText('support.pageTitle')).toBeInTheDocument();
  expect(screen.getByText('support.pageSubtitle')).toBeInTheDocument();
  expect(screen.getByText('support.directAssistance.title')).toBeInTheDocument();
  expect(screen.getByText('support.knowledgeBase.title')).toBeInTheDocument();
});

test('renders both Direct Assistance buttons', () => {
  renderPage();
  expect(screen.getByRole('button', { name: /support\.directAssistance\.contactSupport/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /support\.directAssistance\.reportProblem/ })).toBeInTheDocument();
});

test('renders all four Knowledge Base categories, each linking to a real article route', () => {
  const { container } = renderPage();
  expect(screen.getByText('Getting Started')).toBeInTheDocument();
  expect(screen.getByText('Expenses & Splits')).toBeInTheDocument();
  expect(screen.getByText('Trip Fund')).toBeInTheDocument();
  expect(screen.getByText('Settling Balances')).toBeInTheDocument();
  const links = Array.from(container.querySelectorAll('.sup-kb-item')).map((a) => a.getAttribute('href'));
  expect(links).toEqual([
    '/trips/short-1/support/getting-started',
    '/trips/short-1/support/expenses',
    '/trips/short-1/support/fund',
    '/trips/short-1/support/settlements',
  ]);
});

test('uses exact Material Symbol icon names for the category tiles, never Bootstrap Icons', () => {
  const { container } = renderPage();
  const iconNames = Array.from(container.querySelectorAll('.sup-kb-item__icon-tile .material-symbols-outlined')).map((el) => el.textContent);
  expect(iconNames).toEqual(['rocket_launch', 'receipt_long', 'savings', 'account_balance_wallet']);
  expect(container.querySelector('.bi')).not.toBeInTheDocument();
});

test('uses the responsive grid contract classes (sup-grid, sup-kb-grid)', () => {
  const { container } = renderPage();
  expect(container.querySelector('.sup-grid')).toBeInTheDocument();
  expect(container.querySelector('.sup-kb-grid')).toBeInTheDocument();
});

test('Contact Support opens the drawer with no subject preselected', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /support\.directAssistance\.contactSupport/ }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('');
});

test('Report a Problem opens the drawer with technical_problem preselected', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /support\.directAssistance\.reportProblem/ }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('technical_problem');
});

test('the page renders immediately with no loading placeholder -- no fetch of its own', () => {
  const { container } = renderPage();
  expect(container.querySelector('.section-loading')).not.toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});
