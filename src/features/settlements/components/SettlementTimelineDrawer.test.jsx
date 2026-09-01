import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SettlementTimelineDrawer from './SettlementTimelineDrawer';
import { getSettlementTimeline } from '../api/settlementsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'ar' } }) }));
jest.mock('../api/settlementsApi', () => ({ getSettlementTimeline: jest.fn() }));

beforeEach(() => { getSettlementTimeline.mockResolvedValue([]); });

test('timeline timestamps use app locale and stay LTR', async () => {
  const createdAt = '2026-08-20T12:30:00Z';
  getSettlementTimeline.mockResolvedValue([{ id: 'e1', event_type: 'settlement_confirmed', created_at: createdAt, actor: null, summary: {} }]);
  render(<SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00' }} currency="SAR" onClose={jest.fn()} />);

  const timestamp = await screen.findByText(new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(createdAt)));
  expect(timestamp).toHaveAttribute('dir', 'ltr');
});

test('opening the drawer moves focus to the close control, and Escape closes it', async () => {
  const onClose = jest.fn();
  render(<SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00' }} currency="SAR" onClose={onClose} />);
  await screen.findByRole('dialog');
  expect(screen.getByRole('button', { name: 'common.close' })).toHaveFocus();

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('Tab is contained within the drawer, never escaping to the page behind it', async () => {
  render(<SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00' }} currency="SAR" onClose={jest.fn()} />);
  const closeBtn = await screen.findByRole('button', { name: 'common.close' });
  expect(closeBtn).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(closeBtn).toHaveFocus();
});

test('without action props (BalancesPage\'s own usage), no action footer renders even for a pending settlement', async () => {
  render(<SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00', status: 'pending' }} currency="SAR" onClose={jest.fn()} />);
  await screen.findByRole('dialog');
  expect(screen.queryByText('settlements.yesReceived')).not.toBeInTheDocument();
});

test('with canReview, the recipient recovery actions render and dispatch the right decision', async () => {
  const onConfirm = jest.fn();
  const onNotReceived = jest.fn();
  const onCheckLater = jest.fn();
  render(
    <SettlementTimelineDrawer
      tripId="t1"
      settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00', status: 'pending' }}
      currency="SAR"
      onClose={jest.fn()}
      canReview
      onConfirm={onConfirm}
      onNotReceived={onNotReceived}
      onCheckLater={onCheckLater}
    />,
  );
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByText('settlements.yesReceived'));
  expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: 's1' }));
  fireEvent.click(screen.getByText('settlements.notReceivedAction'));
  expect(onNotReceived).toHaveBeenCalled();
  fireEvent.click(screen.getByText('settlements.checkLaterAction'));
  expect(onCheckLater).toHaveBeenCalled();
});

test('with canCancel only (the reporter, not the recipient), only Withdraw renders', async () => {
  const onCancel = jest.fn();
  render(
    <SettlementTimelineDrawer
      tripId="t1"
      settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00', status: 'pending' }}
      currency="SAR"
      onClose={jest.fn()}
      canCancel
      onCancel={onCancel}
    />,
  );
  await screen.findByRole('dialog');
  expect(screen.queryByText('settlements.yesReceived')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('settlements.withdrawReport'));
  expect(onCancel).toHaveBeenCalled();
});

test('with canRetry on a rejected settlement, Ask to Check Again renders and dispatches', async () => {
  const onRetry = jest.fn();
  render(
    <SettlementTimelineDrawer
      tripId="t1"
      settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00', status: 'rejected' }}
      currency="SAR"
      onClose={jest.fn()}
      canRetry
      onRetry={onRetry}
    />,
  );
  await screen.findByRole('dialog');
  fireEvent.click(screen.getByText('settlements.retryAction'));
  expect(onRetry).toHaveBeenCalled();
});

test('closing returns focus to whatever triggered the drawer', async () => {
  const Wrapper = () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>open</button>
        {open && <SettlementTimelineDrawer tripId="t1" settlement={{ id: 's1', from_name: 'A', to_name: 'B', amount: '10.00' }} currency="SAR" onClose={() => setOpen(false)} />}
      </>
    );
  };
  render(<Wrapper />);
  const trigger = screen.getByRole('button', { name: 'open' });
  trigger.focus();
  fireEvent.click(trigger);
  await screen.findByRole('dialog');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
});
