import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SettlementActionDialog from './SettlementActionDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en', changeLanguage: jest.fn() } }) }));

const fahad = { id: 'm1', display_name: 'Fahad', avatar: { type: 'initials', color: 'indigo' } };
const saud = { id: 'm2', display_name: 'Saud', avatar: { type: 'initials', color: 'slate' } };
const members = [fahad, saud];

const moneyMatcher = (text) => (_content, node) => (
  node?.tagName?.toLowerCase() === 'bdi' && node.textContent.replace(/\s+/g, ' ').trim() === text
);
test('the counterparty debt renders through the canonical Money/bdi component, isolated LTR', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  // 148.00 SAR appears three times (counterpart card, summary's "owed
  // before" and "this payment" rows, since the amount defaults to the
  // full debt) -- every one of them must be a real Money/bdi node,
  // isolated LTR regardless of which one this is.
  const moneyNodes = screen.getAllByText(moneyMatcher('148.00 SAR'));
  expect(moneyNodes).toHaveLength(3); // each one IS the <bdi> itself, per moneyMatcher
  moneyNodes.forEach((node) => expect(node).toHaveAttribute('dir', 'ltr'));
});

test('Amount and Date are both real <input> elements sharing the canonical field-control base class -- the shared height rule applies identically to both', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  const amountInput = screen.getByLabelText('expense.amount');
  const dateInput = screen.getByLabelText('expense.date');
  expect(amountInput.tagName).toBe('INPUT');
  expect(dateInput.tagName).toBe('INPUT');
  expect(amountInput).toHaveClass('field-control');
  expect(dateInput).toHaveClass('field-control');
  expect(amountInput.type).toBe('number');
  expect(dateInput.type).toBe('date');
});

test('admin mode pre-fills its two pickers from initialFromId/initialToId when given (Suggested Settlements\' Record button)', () => {
  render(<SettlementActionDialog mode="admin" members={members} currentMember={fahad} currency="SAR" initialFromId="m2" initialToId="m1" onSave={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByLabelText('settlements.payer')).toHaveValue('m2');
  expect(screen.getByLabelText('settlements.recipient')).toHaveValue('m1');
});

test('admin mode still defaults to blank pickers when initialFromId/initialToId are omitted -- every existing caller keeps its current behavior', () => {
  render(<SettlementActionDialog mode="admin" members={members} currentMember={fahad} currency="SAR" onSave={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByLabelText('settlements.payer')).toHaveValue('');
  expect(screen.getByLabelText('settlements.recipient')).toHaveValue('');
});

test('the admin mode\'s member pickers are real <select> elements sharing the same field-control base class as Amount/Date', () => {
  render(<SettlementActionDialog mode="admin" members={members} currentMember={fahad} currency="SAR" onSave={jest.fn()} onClose={jest.fn()} />);
  const fromSelect = screen.getByLabelText('settlements.payer');
  expect(fromSelect.tagName).toBe('SELECT');
  expect(fromSelect).toHaveClass('field-control');
});

test('the amount field uses the canonical financial field-control class, not a raw unstyled input', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  const amountInput = screen.getByLabelText('expense.amount');
  expect(amountInput).toHaveClass('field-control', 'field-control--amount');
  const dateInput = screen.getByLabelText('expense.date');
  expect(dateInput).toHaveClass('field-control');
  const noteInput = screen.getByLabelText('expense.notes');
  expect(noteInput).toHaveClass('field-control');
});

test('the summary card shows owed-before/this-payment/remaining as a compact ledger block', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  // "debtBefore" appears twice (the counterpart card's label and the
  // summary row's label); the other two summary labels are unique.
  expect(screen.getAllByText('settlements.debtBefore')).toHaveLength(2);
  expect(screen.getByText('settlements.thisPayment')).toBeInTheDocument();
  expect(screen.getByText('settlements.remainingAfter')).toBeInTheDocument();
  // 148.00 SAR appears three times (counterpart card + summary's owed-
  // before + this-payment rows, since the amount defaults to the full
  // debt); remaining is a unique 0.00 SAR.
  expect(screen.getAllByText(moneyMatcher('148.00 SAR'))).toHaveLength(3);
  expect(screen.getByText(moneyMatcher('0.00 SAR'))).toBeInTheDocument();
});

test('the report mode shows the "balance only moves once confirmed" callout, never claiming an immediate update', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByText(`settlements.balanceNoteReport:{"name":"Saud"}`)).toBeInTheDocument();
  expect(screen.queryByText(/balanceNoteReceived/)).not.toBeInTheDocument();
});

test('the received mode shows the immediate-confirmation callout instead', () => {
  render(<SettlementActionDialog mode="received" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  expect(screen.getByText('settlements.balanceNoteReceived')).toBeInTheDocument();
});

test('the admin mode requires the acknowledgement checkbox before it will submit', async () => {
  const onSave = jest.fn().mockResolvedValue({});
  render(<SettlementActionDialog mode="admin" members={members} currentMember={fahad} currency="SAR" onSave={onSave} onClose={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('settlements.payer'), { target: { value: 'm2' } });
  fireEvent.change(screen.getByLabelText('settlements.recipient'), { target: { value: 'm1' } });
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '20' } });
  const submit = screen.getByRole('button', { name: 'settlements.recordExternal' });
  expect(submit).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(submit).not.toBeDisabled();
  fireEvent.click(submit);
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ acknowledged: true })));
});

test('an amount over the known debt is blocked with an inline error, not a silent clamp', () => {
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('expense.amount'), { target: { value: '200' } });
  expect(screen.getByText('settlements.errors.exceedsDebt')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'settlements.iPaid' })).toBeDisabled();
});

test('Escape closes the dialog', () => {
  const onClose = jest.fn();
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={onClose} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});

test('clicking the backdrop closes the dialog, clicking inside it does not', () => {
  const onClose = jest.fn();
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={jest.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('dialog'));
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('presentation'));
  expect(onClose).toHaveBeenCalled();
});

test('a submit failure keeps the dialog open and shows the error inline', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('network down'));
  render(<SettlementActionDialog mode="report" members={members} currentMember={fahad} currency="SAR" counterpart={saud} debt="148.00" onSave={onSave} onClose={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'settlements.iPaid' }));
  expect(await screen.findByText('network down')).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
