import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TripSettings from './TripSettings';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

const baseTrip = { title: 'Ski Trip', budget: '10000.00', total_budget: '10000.00', currency: 'SAR', join_policy: 'open', settlement_confirmation_mode: 'immediate' };
const permissions = { canEditTrip: true, canArchiveTrip: false, canRestoreTrip: false };

const renderSettings = (props = {}) => render(
  <TripSettings trip={baseTrip} permissions={permissions} onUpdate={jest.fn()} onArchive={jest.fn()} onRestore={jest.fn()} {...props} />,
);

test('budget is always a plain editable field -- the explicit Fund budget target, never locked by Fund/round activity', () => {
  const onUpdate = jest.fn();
  renderSettings({ onUpdate });
  fireEvent.change(screen.getByDisplayValue('10000.00'), { target: { value: '12000' } });
  fireEvent.click(screen.getByText('common.save'));
  expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ budget: '12000' }));
});

test('saving other fields still includes the current budget value in the payload (a plain form field, not conditionally omitted)', () => {
  const onUpdate = jest.fn();
  renderSettings({ onUpdate });
  fireEvent.change(screen.getByDisplayValue('Ski Trip'), { target: { value: 'Renamed Trip' } });
  fireEvent.click(screen.getByText('common.save'));
  const payload = onUpdate.mock.calls[0][0];
  expect(payload.title).toBe('Renamed Trip');
  expect(payload.budget).toBe('10000.00');
});
