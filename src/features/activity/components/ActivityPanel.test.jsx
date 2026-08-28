import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityPanel from './ActivityPanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'ar' } }) }));

test('activity timestamps follow app locale and remain LTR in RTL layouts', () => {
  render(<ActivityPanel events={[{ id: 'e1', event_type: 'trip_updated', created_at: '2026-08-20T12:30:00Z', actor: null, summary: {} }]} />);

  const timestamp = screen.getByText(new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date('2026-08-20T12:30:00Z')));
  expect(timestamp).toHaveAttribute('dir', 'ltr');
});
