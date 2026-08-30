import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import GovernancePanel from '../components/GovernancePanel';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));

test('renders pending request and calls approval action', () => {
  const onReview = jest.fn();
  render(<GovernancePanel requests={[{ id: 'r1', display_name: 'Guest', avatar_key: 'avatar_01', identity_type: 'guest' }]} invitations={[]} bans={[]} members={[]} onReview={onReview} onInvite={jest.fn()} />);
  expect(screen.getByText('Guest')).toBeInTheDocument();
  fireEvent.click(screen.getByText('governance.approve'));
  expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), 'approve');
});
