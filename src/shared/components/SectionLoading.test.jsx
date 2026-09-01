import React from 'react';
import { render, screen } from '@testing-library/react';
import SectionLoading from './SectionLoading';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));

test('announces itself as a live status region, not a silent blank block', () => {
  render(<SectionLoading />);
  const status = screen.getByRole('status');
  expect(status).toHaveAttribute('aria-live', 'polite');
});

test('shows the loading label by default', () => {
  render(<SectionLoading />);
  expect(screen.getByText('common.loading')).toBeInTheDocument();
});

test('a custom label overrides the default', () => {
  render(<SectionLoading label="Fetching balances…" />);
  expect(screen.getByText('Fetching balances…')).toBeInTheDocument();
  expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
});

test('compact mode omits the text label -- a minimal inline placeholder, not a full section block', () => {
  render(<SectionLoading compact />);
  expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
});

test('reserves layout space via minHeight so the section does not collapse then jump once data arrives', () => {
  render(<SectionLoading minHeight={140} />);
  expect(screen.getByRole('status')).toHaveStyle({ minBlockSize: '140px' });
});
