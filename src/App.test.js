import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./i18n', () => ({}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => ({ 'create.new.trip': 'Create new trip', 'join.existing.trip': 'Join Existing Trip' }[key] || key),
    i18n: { language: 'en', on: jest.fn(), off: jest.fn(), changeLanguage: jest.fn() },
  }),
}));
jest.mock('./utils/api', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null })),
  getTrips: jest.fn(() => Promise.resolve({ results: [] })),
  logout: jest.fn(),
  updateProfile: jest.fn(),
}));

test('renders guest trip entry points', async () => {
  render(<App />);
  expect(await screen.findByText(/continue with email/i)).toBeInTheDocument();
  expect(screen.getByText(/create new trip/i)).toBeInTheDocument();
  expect(screen.getByText(/join existing trip/i)).toBeInTheDocument();
});
