import React from 'react';
import { render, screen } from '@testing-library/react';
import SpendingSplit from './SpendingSplit';
import en from '../../../../i18n/locales/en.json';
import ar from '../../../../i18n/locales/ar.json';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('zero spending shows a neutral empty state, never a misleading 100% badge', () => {
  render(<SpendingSplit split={{ shared: '0.00', personal: '0.00', shared_percent: 0, personal_percent: 0 }} />);
  expect(screen.queryByText('100%')).not.toBeInTheDocument();
  expect(screen.getByText('dashboard.overview.noSpendingYet')).toBeInTheDocument();
});

test('zero spending reports both legend percentages as 0%, sourced from the server, not computed here', () => {
  render(<SpendingSplit split={{ shared: '0.00', personal: '0.00', shared_percent: 0, personal_percent: 0 }} />);
  const values = screen.getAllByText((_, node) => node?.classList?.contains('ov-split__legend-value'));
  expect(values).toHaveLength(2);
  values.forEach((node) => expect(node.textContent).toBe('0%'));
});

test('non-zero spending shows the 100%-of-classified-spending badge and the real split', () => {
  render(<SpendingSplit split={{ shared: '5018.00', personal: '2702.00', shared_percent: 65, personal_percent: 35 }} />);
  expect(screen.getByText('100%')).toBeInTheDocument();
  expect(screen.queryByText('dashboard.overview.noSpendingYet')).not.toBeInTheDocument();
  expect(screen.getByText('65%')).toBeInTheDocument();
  expect(screen.getByText('35%')).toBeInTheDocument();
});

test('never recomputes the split -- renders exactly the shared_percent/personal_percent the server sent, even if they do not sum to 100', () => {
  render(<SpendingSplit split={{ shared: '10.00', personal: '5.00', shared_percent: 67, personal_percent: 33 }} />);
  expect(screen.getByText('67%')).toBeInTheDocument();
  expect(screen.getByText('33%')).toBeInTheDocument();
});

test('percentage values are bidi-isolated LTR units', () => {
  render(<SpendingSplit split={{ shared: '5018.00', personal: '2702.00', shared_percent: 65, personal_percent: 35 }} />);
  const shared = screen.getByText('65%');
  expect(shared.tagName.toLowerCase()).toBe('bdi');
  expect(shared).toHaveAttribute('dir', 'ltr');
});

test('shows explanatory helper copy for what shared vs personal means', () => {
  render(<SpendingSplit split={{ shared: '5018.00', personal: '2702.00', shared_percent: 65, personal_percent: 35 }} />);
  expect(screen.getByText('dashboard.overview.spendingSplitHelp')).toBeInTheDocument();
});

test('each legend row carries a concise description (tooltip) distinguishing shared from personal', () => {
  render(<SpendingSplit split={{ shared: '5018.00', personal: '2702.00', shared_percent: 65, personal_percent: 35 }} />);
  const rows = document.querySelectorAll('.ov-split__legend-row');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveAttribute('title', 'dashboard.overview.sharedDescription');
  expect(rows[1]).toHaveAttribute('title', 'dashboard.overview.personalDescription');
});

test('the new Spending Split copy keys have real, non-empty Arabic translations distinct from English', () => {
  const keys = [
    'dashboard.overview.spendingSplitHelp',
    'dashboard.overview.noSpendingYet',
    'dashboard.overview.sharedDescription',
    'dashboard.overview.personalDescription',
  ];
  keys.forEach((key) => {
    expect(ar[key]).toBeTruthy();
    expect(ar[key]).not.toBe(en[key]);
  });
});
