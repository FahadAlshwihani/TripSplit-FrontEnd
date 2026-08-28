import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import useModalDialog from './useModalDialog';

const Harness = ({ onClose }) => {
  const ref = useModalDialog(onClose);
  return <div ref={ref} role="dialog" tabIndex={-1}><button>first</button><button>last</button></div>;
};

test('focuses the first control and closes on Escape', () => {
  const onClose = jest.fn();
  render(<Harness onClose={onClose} />);

  expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('contains forward and reverse tab movement', () => {
  render(<Harness onClose={jest.fn()} />);
  const first = screen.getByRole('button', { name: 'first' });
  const last = screen.getByRole('button', { name: 'last' });

  last.focus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(first).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
});

test('restores focus when the dialog unmounts', () => {
  const Wrapper = () => {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>open</button>{open && <Harness onClose={() => setOpen(false)} />}</>;
  };
  render(<Wrapper />);
  const trigger = screen.getByRole('button', { name: 'open' });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(trigger).toHaveFocus();
});
