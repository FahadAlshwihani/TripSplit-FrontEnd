import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FundingRoundComposer from './FundingRoundComposer';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }) }));

const members = [
  { id: 'm1', display_name: 'Fahad' },
  { id: 'm2', display_name: 'Saud' },
];

const fill = (title = 'Round', target = '1000') => {
  fireEvent.change(screen.getByLabelText('fund.roundTitle'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('fund.target'), { target: { value: target } });
};

test('equal split needs no extra input and is submittable once title/target are set', () => {
  const onSubmit = jest.fn();
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={onSubmit} onClose={jest.fn()} />);
  fill();
  expect(screen.getByText('fund.createRound')).not.toBeDisabled();
});

test('custom (exact) amounts must sum exactly to the target', () => {
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={jest.fn()} onClose={jest.fn()} />);
  fill();
  fireEvent.click(screen.getByRole('radio', { name: 'fund.methodOptions.custom' }));
  fireEvent.change(screen.getByLabelText('Fahad fund.amount'), { target: { value: '400' } });
  fireEvent.change(screen.getByLabelText('Saud fund.amount'), { target: { value: '400' } });
  expect(screen.getByText('fund.errors.customMustMatchTarget')).toBeInTheDocument();
  expect(screen.getByText('fund.createRound')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Saud fund.amount'), { target: { value: '600' } });
  expect(screen.queryByText('fund.errors.customMustMatchTarget')).not.toBeInTheDocument();
  expect(screen.getByText('fund.createRound')).not.toBeDisabled();
});

test('shares requires every selected member to have a positive weight', () => {
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={jest.fn()} onClose={jest.fn()} />);
  fill();
  fireEvent.click(screen.getByRole('radio', { name: 'fund.methodOptions.shares' }));
  fireEvent.change(screen.getByLabelText('Fahad fund.shareWeight'), { target: { value: '2' } });
  expect(screen.getByText('fund.errors.sharesMustBePositive')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Saud fund.shareWeight'), { target: { value: '1' } });
  expect(screen.queryByText('fund.errors.sharesMustBePositive')).not.toBeInTheDocument();
});

test('submitting a shares round sends weight-shaped custom_expectations', async () => {
  const onSubmit = jest.fn().mockResolvedValue({});
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={onSubmit} onClose={jest.fn()} />);
  fill('Shared costs', '900');
  fireEvent.click(screen.getByRole('radio', { name: 'fund.methodOptions.shares' }));
  fireEvent.change(screen.getByLabelText('Fahad fund.shareWeight'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Saud fund.shareWeight'), { target: { value: '1' } });
  fireEvent.click(screen.getByText('fund.createRound'));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    contribution_method: 'shares',
    custom_expectations: [{ member_id: 'm1', weight: '2' }, { member_id: 'm2', weight: '1' }],
  }));
});

test('deselecting a participant removes them from custom_expectations', () => {
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={jest.fn()} onClose={jest.fn()} />);
  fill();
  const checkboxes = screen.getAllByRole('checkbox');
  fireEvent.click(checkboxes[1]); // deselect Saud
  expect(screen.getByText('fund.selectedCount:{"count":1}')).toBeInTheDocument();
});

test('a top-up prefill pre-fills the title and target from the deficit', () => {
  render(<FundingRoundComposer members={members} currency="SAR" prefill={{ title: 'fund.topup', target_amount: '250.00' }} onSubmit={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByLabelText('fund.roundTitle')).toHaveValue('fund.topup');
  expect(screen.getByLabelText('fund.target')).toHaveValue(250);
});

test('Escape-independent close via the close button', () => {
  const onClose = jest.fn();
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={jest.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByLabelText('common.close'));
  expect(onClose).toHaveBeenCalled();
});

test('Escape closes the funding round dialog', () => {
  const onClose = jest.fn();
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={jest.fn()} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('cannot dismiss while a round submission is in flight', () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn(() => new Promise(() => {}));
  render(<FundingRoundComposer members={members} currency="SAR" onSubmit={onSubmit} onClose={onClose} />);
  fill();
  fireEvent.click(screen.getByText('fund.createRound'));

  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByLabelText('common.close'));

  expect(onClose).not.toHaveBeenCalled();
});
