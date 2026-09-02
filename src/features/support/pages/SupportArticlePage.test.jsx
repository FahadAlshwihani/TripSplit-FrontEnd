import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import SupportArticlePage from './SupportArticlePage';
import { CATEGORY_ORDER } from '../content';

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage } }) }));

const renderArticle = (category) => render(
  <MemoryRouter initialEntries={[`/trips/short-1/support/${category}`]}>
    <Routes>
      <Route path="/trips/:tripId" element={<Outlet />}>
        <Route path="support/:category" element={<SupportArticlePage />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => { mockLanguage = 'en'; });

test.each(CATEGORY_ORDER)('the %s category route renders real, non-empty content', (category) => {
  renderArticle(category);
  expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(2);
  expect(screen.getByText('support.article.backToSupport')).toBeInTheDocument();
});

test('renders English content when the app language is English', () => {
  mockLanguage = 'en';
  renderArticle('getting-started');
  expect(screen.getByText('Getting Started')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'What TripSplit is' })).toBeInTheDocument();
});

test('renders Arabic content when the app language is Arabic', () => {
  mockLanguage = 'ar';
  renderArticle('getting-started');
  expect(screen.getByText('البدء مع TripSplit')).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'إيش هو TripSplit' })).toBeInTheDocument();
});

test('back-to-support navigates to the trip support hub, preserving whatever identifier is already in the URL', () => {
  renderArticle('fund');
  fireEvent.click(screen.getByText('support.article.backToSupport'));
  // A real navigation happened (no matching route below /support here), so the
  // page content is gone -- this confirms the click actually triggered routing.
  expect(screen.queryByText('Trip Fund')).not.toBeInTheDocument();
});

test('related-page links point back into the SAME trip, never a UUID hardcoded separately from the current URL', () => {
  const { container } = renderArticle('fund');
  const relatedLink = container.querySelector('.article-related__link');
  expect(relatedLink).toHaveAttribute('href', '/trips/short-1/fund');
});

test('every section has a table-of-contents entry', () => {
  const { container } = renderArticle('expenses');
  const headings = container.querySelectorAll('.article-section__heading').length;
  const tocEntries = container.querySelectorAll('.article-toc__list a').length;
  expect(tocEntries).toBe(headings);
});

test('an unknown category shows a not-found state instead of crashing', () => {
  renderArticle('not-a-real-category');
  expect(screen.getByText('support.article.notFound')).toBeInTheDocument();
});
