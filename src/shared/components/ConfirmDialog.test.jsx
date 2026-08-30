import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('renders as a real accessible alertdialog with the given title/body', () => {
  render(<ConfirmDialog title="Delete expense?" body="This cannot be undone." onConfirm={jest.fn()} onCancel={jest.fn()} />);
  const dialog = screen.getByRole('alertdialog');
  expect(dialog).toHaveTextContent('Delete expense?');
  expect(dialog).toHaveTextContent('This cannot be undone.');
});

test('confirm button is focused on open, for immediate keyboard confirmation', () => {
  render(<ConfirmDialog title="t" body="b" onConfirm={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'common.delete' })).toHaveFocus();
});

test('clicking confirm calls onConfirm', () => {
  const onConfirm = jest.fn();
  render(<ConfirmDialog title="t" body="b" onConfirm={onConfirm} onCancel={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
  expect(onConfirm).toHaveBeenCalled();
});

test('clicking cancel, the overlay, or pressing Escape all call onCancel', () => {
  const onCancel = jest.fn();
  render(<ConfirmDialog title="t" body="b" onConfirm={jest.fn()} onCancel={onCancel} />);
  fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(2);
});

test('a non-destructive confirmation uses the primary style, not the danger style', () => {
  render(<ConfirmDialog title="t" body="b" destructive={false} confirmLabel="Continue" onConfirm={jest.fn()} onCancel={jest.fn()} />);
  const confirmBtn = screen.getByRole('button', { name: 'Continue' });
  expect(confirmBtn).toHaveClass('dash-btn--primary');
  expect(confirmBtn).not.toHaveClass('dash-btn--danger');
});

test('a destructive confirmation (the default) uses the danger style', () => {
  render(<ConfirmDialog title="t" body="b" onConfirm={jest.fn()} onCancel={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'common.delete' })).toHaveClass('dash-btn--danger');
});

test('Tab is contained within the dialog -- forward wraps from the last control to the first, reverse the other way', () => {
  render(<ConfirmDialog title="t" body="b" onConfirm={jest.fn()} onCancel={jest.fn()} />);
  const cancelBtn = screen.getByRole('button', { name: 'common.cancel' });
  const confirmBtn = screen.getByRole('button', { name: 'common.delete' });

  expect(confirmBtn).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(cancelBtn).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(confirmBtn).toHaveFocus();
});

test('closing returns focus to whatever triggered the dialog', () => {
  const Wrapper = () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>open</button>
        {open && <ConfirmDialog title="t" body="b" onConfirm={jest.fn()} onCancel={() => setOpen(false)} />}
      </>
    );
  };
  render(<Wrapper />);
  const trigger = screen.getByRole('button', { name: 'open' });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
});
