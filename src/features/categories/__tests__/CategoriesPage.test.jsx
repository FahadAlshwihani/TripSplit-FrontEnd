import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import CategoriesPage from '../pages/CategoriesPage';
import { getCategories, getCategoryBudgets } from '../api/categoriesApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));
jest.mock('../api/categoriesApi', () => ({
  getCategories: jest.fn(),
  getCategoryBudgets: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  archiveCategory: jest.fn(),
  setCategoryBudget: jest.fn(),
  resetCategoryBudget: jest.fn(),
}));

const trip = { currency: 'SAR' };
const category = { id: 'food-id', code: 'food', name: 'Food', icon_key: 'food', is_default: true };
const budget = { category: 'food', budget: '100.00', spent: '10.00', remaining: '90.00', usage_percentage: '10.00' };

const renderPage = () => render(
  <MemoryRouter initialEntries={['/trips/t1/categories']}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet context={{ trip, tripId: 't1', permissions: { canManageMembers: true } }} />}>
        <Route path="categories" element={<CategoriesPage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  jest.clearAllMocks();
  getCategories.mockResolvedValue({ results: [category] });
  getCategoryBudgets.mockResolvedValue({ results: [budget], summary: { trip_budget: '500', allocated: '100', unallocated: '400' } });
});

test('while categories are loading, a section-scoped placeholder shows -- never full-page NeoLoading', () => {
  getCategories.mockReturnValue(new Promise(() => {}));
  const { container } = renderPage();
  expect(container.querySelector('.section-loading')).toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('renders the category manager once data resolves', async () => {
  renderPage();
  expect(await screen.findByText(/Food/)).toBeInTheDocument();
  expect(screen.getByText('categories.title')).toBeInTheDocument();
});

test('a failed load surfaces ErrorState with retry', async () => {
  getCategories.mockRejectedValue(new Error('boom'));
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('boom');
});
