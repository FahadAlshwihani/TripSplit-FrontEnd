import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripSupportPage from './TripSupportPage';

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage } }) }));
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

beforeEach(() => { mockLanguage = 'en'; });

test('renders the Stitch structure: title, navigation, Knowledge Base', () => {
  renderPage();
  expect(screen.getByText('support.pageTitle')).toBeInTheDocument();
  expect(screen.getByText('support.pageSubtitle')).toBeInTheDocument();
  expect(screen.getByText('support.knowledgeBase.title')).toBeInTheDocument();
  expect(screen.getByText('support.knowledgeBase.subtitle')).toBeInTheDocument();
});

test('Articles is the active tab by default, its panel visible, the contact form hidden', () => {
  renderPage();
  expect(screen.getByRole('tab', { name: /support\.nav\.articles/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).toHaveAttribute('aria-selected', 'false');
  expect(document.getElementById('sup-panel-articles')).not.toHaveAttribute('hidden');
  expect(document.getElementById('sup-panel-contact')).toHaveAttribute('hidden');
});

test('the active nav tab carries the active visual class, the inactive one does not', () => {
  renderPage();
  expect(screen.getByRole('tab', { name: /support\.nav\.articles/ })).toHaveClass('sup-nav-tab--active');
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).not.toHaveClass('sup-nav-tab--active');
});

test('clicking Contact Us switches the active panel, clicking Articles switches back', () => {
  renderPage();
  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.contactUs/ }));
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).toHaveClass('sup-nav-tab--active');
  expect(document.getElementById('sup-panel-contact')).not.toHaveAttribute('hidden');
  expect(document.getElementById('sup-panel-articles')).toHaveAttribute('hidden');

  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.articles/ }));
  expect(screen.getByRole('tab', { name: /support\.nav\.articles/ })).toHaveAttribute('aria-selected', 'true');
  expect(document.getElementById('sup-panel-articles')).not.toHaveAttribute('hidden');
});

test('Report a Problem switches to the Contact Us tab and preselects technical_problem', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /support\.directAssistance\.reportProblem/ }));
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('technical_problem');
});

test('draft survives Contact Us -> Articles -> Contact Us (the form is never unmounted)', () => {
  renderPage();
  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.contactUs/ }));
  fireEvent.change(screen.getByLabelText('support.form.message'), { target: { value: 'my in-progress draft' } });
  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.articles/ }));
  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.contactUs/ }));
  expect(screen.getByLabelText('support.form.message')).toHaveValue('my in-progress draft');
});

test('no Support modal, drawer, backdrop, close button, or "Back to articles" control exists anywhere', () => {
  const { container } = renderPage();
  fireEvent.click(screen.getByRole('tab', { name: /support\.nav\.contactUs/ }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.querySelector('.support-drawer-overlay')).not.toBeInTheDocument();
  expect(container.querySelector('.support-drawer')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'common.close' })).not.toBeInTheDocument();
  expect(screen.queryByText('support.form.backToArticles')).not.toBeInTheDocument();
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

test('no icon name ever leaks as visible plain text outside a material-symbols-outlined element', () => {
  renderPage();
  ['library_books', 'chat_bubble', 'report_problem', 'rocket_launch', 'receipt_long', 'savings', 'account_balance_wallet', 'arrow_right_alt'].forEach((name) => {
    const all = screen.queryAllByText(name);
    const wrapped = screen.queryAllByText(name, { selector: '.material-symbols-outlined' });
    expect(wrapped.length).toBe(all.length);
  });
});

test('uses the responsive grid contract classes (sup-grid, sup-kb-grid)', () => {
  const { container } = renderPage();
  expect(container.querySelector('.sup-grid')).toBeInTheDocument();
  expect(container.querySelector('.sup-kb-grid')).toBeInTheDocument();
});

test('the page renders immediately with no full-page loading placeholder -- no fetch of its own', () => {
  const { container } = renderPage();
  expect(container.querySelector('.section-loading')).not.toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('renders real Arabic navigation labels, with no leaked English icon text', () => {
  mockLanguage = 'ar';
  renderPage();
  expect(screen.getByRole('tab', { name: /support\.nav\.articles/ })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /support\.nav\.contactUs/ })).toBeInTheDocument();
  ['library_books', 'chat_bubble', 'report_problem'].forEach((name) => {
    const all = screen.queryAllByText(name);
    const wrapped = screen.queryAllByText(name, { selector: '.material-symbols-outlined' });
    expect(wrapped.length).toBe(all.length);
  });
});
