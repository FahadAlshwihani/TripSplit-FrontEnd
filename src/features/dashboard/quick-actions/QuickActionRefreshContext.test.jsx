import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  QuickActionRefreshProvider,
  useQuickActionInvalidation,
  useQuickActionRevision,
} from './QuickActionRefreshContext';

function Harness() {
  const invalidate = useQuickActionInvalidation();
  const overview = useQuickActionRevision('overview');
  const expenses = useQuickActionRevision('expenses');
  const fund = useQuickActionRevision('fund');
  return (
    <>
      <output aria-label="overview revision">{overview}</output>
      <output aria-label="expenses revision">{expenses}</output>
      <output aria-label="fund revision">{fund}</output>
      <button type="button" onClick={() => invalidate(['overview', 'expenses'])}>invalidate expense action</button>
    </>
  );
}

test('increments only the domains affected by a completed quick action', () => {
  render(<QuickActionRefreshProvider><Harness /></QuickActionRefreshProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'invalidate expense action' }));

  expect(screen.getByLabelText('overview revision')).toHaveTextContent('1');
  expect(screen.getByLabelText('expenses revision')).toHaveTextContent('1');
  expect(screen.getByLabelText('fund revision')).toHaveTextContent('0');
});
