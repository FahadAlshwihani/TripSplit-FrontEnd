import React from 'react';
import { render, screen } from '@testing-library/react';
import SettlementsPanel from '../../settlements/components/SettlementsPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

test('renders the lightweight pending settlement confirmation badge', () => {
  render(<SettlementsPanel members={[]} currency="SAR" settlements={[]} currentMember={{ id: 'me', role: 'member' }} pendingCount={2} onSave={jest.fn()} onDelete={jest.fn()} onReview={jest.fn()} />);
  expect(screen.getByText('2')).toHaveClass('status-badge');
});
