import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import RefundDistributionModal from './RefundDistributionModal';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('Escape closes the refund distribution dialog', () => {
  const onClose = jest.fn();
  render(<RefundDistributionModal available="100.00" currency="SAR" onPreview={jest.fn()} onConfirm={jest.fn()} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });

  expect(onClose).toHaveBeenCalledTimes(1);
});
