import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import RefundDistributionModal from './RefundDistributionModal';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('Escape closes the refund distribution dialog', () => {
  const onClose = jest.fn();
  render(<RefundDistributionModal available="100.00" currency="SAR" onPreview={jest.fn()} onConfirm={jest.fn()} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test('cannot dismiss while the authoritative preview is loading', () => {
  const onClose = jest.fn();
  const onPreview = jest.fn(() => new Promise(() => {}));
  render(<RefundDistributionModal available="100.00" currency="SAR" onPreview={onPreview} onConfirm={jest.fn()} onClose={onClose} />);
  fireEvent.click(screen.getByRole('button', { name: 'fund.preview' }));

  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'common.close' }));

  expect(onClose).not.toHaveBeenCalled();
});
