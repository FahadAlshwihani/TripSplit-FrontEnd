import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PublicFooter from './PublicFooter';
let mockLanguage = 'ar';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => (mockLanguage === 'ar'
    ? require('../../i18n/locales/ar.json')
    : require('../../i18n/locales/en.json'))[key] }),
}));

afterEach(() => { mockLanguage = 'ar'; });

test.each(['ar', 'en'])('shared public footer uses the exact minimal copy in %s', (language) => {
  mockLanguage = language;
  const { container } = render(<PublicFooter />);
  const footer = container.querySelector('footer.public-footer');
  expect(footer).toBeInTheDocument();
  expect(Array.from(footer.querySelector('.public-footer__inner').children).map((child) => child.className))
    .toEqual(['public-footer__brand text-title', 'public-footer__powered text-copy-sm', 'public-footer__social', 'public-footer__copyright text-caption']);
  expect(within(footer).getByText('قطّتنا - TripSplit')).toBeInTheDocument();
  expect(within(footer).getByText('© 2026 TripSplit Ledger. محاسبة بسيطة، بلا تعقيد.')).toBeInTheDocument();
  expect(within(footer).getByText('Powered by', { exact: false })).toHaveTextContent('Powered by fyaa.io');
});

test('credit and profile links use the established destinations and safe new-tab attributes', () => {
  const { container } = render(<PublicFooter />);
  expect(screen.getByRole('link', { name: 'fyaa.io' })).toHaveAttribute('href', 'https://fyaa.io/');
  const profiles = container.querySelector('.public-footer__social');
  const linkedin = within(profiles).getByRole('link', { name: 'LinkedIn' });
  const github = within(profiles).getByRole('link', { name: 'GitHub' });
  expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/fahad-alshwihani/');
  expect(github).toHaveAttribute('href', 'https://github.com/FahadAlshwihani');
  [linkedin, github].forEach((link) => {
    expect(link).toHaveAttribute('aria-label');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
    expect(link.querySelector('svg')).toBeInTheDocument();
    expect(link).toHaveTextContent('');
  });
  expect(linkedin).toHaveAttribute('aria-label', 'LinkedIn');
  expect(github).toHaveAttribute('aria-label', 'GitHub');
  expect(within(profiles).queryByText('LinkedIn')).not.toBeInTheDocument();
  expect(within(profiles).queryByText('GitHub')).not.toBeInTheDocument();
});
