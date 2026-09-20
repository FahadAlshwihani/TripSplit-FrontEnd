import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SeoHead from './SeoHead';

let mockLanguage = 'ar';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: mockLanguage, resolvedLanguage: mockLanguage } }) }));

const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, REACT_APP_PUBLIC_SITE_URL: 'https://trip.fyaa.io', REACT_APP_SEO_ALLOW_INDEXING: 'true' };
  mockLanguage = 'ar';
});
afterEach(() => {
  cleanup();
  document.head.querySelectorAll('[data-tripsplit-seo]').forEach((node) => node.remove());
  document.head.querySelector('link[rel="canonical"]')?.remove();
});
afterAll(() => { process.env = originalEnv; });

function renderHead(path) {
  return render(<MemoryRouter initialEntries={[path]}><SeoHead /></MemoryRouter>);
}

test('writes Arabic public title, Open Graph, canonical and structured data', async () => {
  renderHead('/');
  await waitFor(() => expect(document.title).toContain('قسم مصاريف السفر'));
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  expect(document.head.querySelector('meta[property="og:site_name"]')).toHaveAttribute('content', 'TripSplit - قطتنا');
  expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute('content', 'https://trip.fyaa.io/OG.png');
  expect(document.head.querySelector('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  expect(document.head.querySelector('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://trip.fyaa.io/');
  expect(document.head.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
});

test('writes English metadata when English is active', async () => {
  mockLanguage = 'en';
  renderHead('/features');
  await waitFor(() => expect(document.title).toContain('TripSplit Features'));
  expect(document.head.querySelector('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');
});

test('removes public canonical and marks private routes noindex', async () => {
  renderHead('/trips/private/expenses');
  await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow'));
  expect(document.head.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
  expect(document.head.querySelector('meta[property="og:image"]')).not.toBeInTheDocument();
  expect(document.head.querySelector('script[type="application/ld+json"]')).not.toBeInTheDocument();
});
