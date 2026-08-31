import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TripSettings from './TripSettings';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const baseTrip = { title: 'Ski Trip', total_budget: '10000.00', currency: 'SAR', join_policy: 'open', settlement_confirmation_mode: 'immediate' };
const permissions = { canEditTrip: true, canArchiveTrip: false, canRestoreTrip: false };

const renderSettings = (props = {}) => render(
  <TripSettings trip={baseTrip} permissions={permissions} onUpdate={jest.fn()} onArchive={jest.fn()} onRestore={jest.fn()} {...props} />,
);

test('Settings never offers a budget field at all -- budget management lives entirely on the Fund page', () => {
  renderSettings();
  expect(screen.queryByDisplayValue('10000.00')).not.toBeInTheDocument();
  expect(screen.queryByText('trip.budget')).not.toBeInTheDocument();
});

test('saving other fields never includes a budget key in the payload', () => {
  const onUpdate = jest.fn();
  renderSettings({ onUpdate });
  fireEvent.change(screen.getByDisplayValue('Ski Trip'), { target: { value: 'Renamed Trip' } });
  fireEvent.click(screen.getByText('common.save'));
  const payload = onUpdate.mock.calls[0][0];
  expect(payload).not.toHaveProperty('budget');
  expect(payload.title).toBe('Renamed Trip');
});
