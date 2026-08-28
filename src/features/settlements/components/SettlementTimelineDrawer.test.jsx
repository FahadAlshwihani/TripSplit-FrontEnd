import React from 'react';
import { render, screen } from '@testing-library/react';
import SettlementTimelineDrawer from './SettlementTimelineDrawer';
import { getSettlementTimeline } from '../api/settlementsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'ar' } }) }));
jest.mock('../api/settlementsApi', () => ({ getSettlementTimeline: jest.fn() }));

test('timeline timestamps use app locale and stay LTR', async () => {
  const createdAt = '2026-08-20T12:30:00Z';
  getSettlementTimeline.mockResolvedValue([{ id: 'e1', event_type: 'settlement_confirmed', created_at: createdAt, actor: null, summary: {} }]);
  render(<SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00' }} currency="SAR" onClose={jest.fn()} />);

  const timestamp = await screen.findByText(new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdAt)));
  expect(timestamp).toHaveAttribute('dir', 'ltr');
});
