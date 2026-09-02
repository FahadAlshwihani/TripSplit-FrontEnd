import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SupportForm from './SupportForm';
import { createSupportTicket } from '../api/supportApi';

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage } }) }));
jest.mock('../api/supportApi', () => ({ createSupportTicket: jest.fn() }));

let mockAuthUser = null;
let mockAuthLoading = false;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, isAuthenticated: Boolean(mockAuthUser), authLoading: mockAuthLoading }) }));

const guestMember = { display_name: 'Guest Traveler', avatar: {} };

// Every exact occurrence of a Material Symbol name anywhere in the
// rendered tree must live inside a .material-symbols-outlined element.
const ICON_NAMES = ['check_circle'];
const assertIconsNeverLeakAsText = () => {
  ICON_NAMES.forEach((name) => {
    const all = screen.queryAllByText(name);
    const wrapped = screen.queryAllByText(name, { selector: '.material-symbols-outlined' });
    expect(wrapped.length).toBe(all.length);
  });
};

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('support.form.phone'), { target: { value: '501234567' } });
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'inquiry' } });
  fireEvent.change(screen.getByLabelText('support.form.message'), { target: { value: 'A real support message with enough detail.' } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = null;
  mockAuthLoading = false;
  mockLanguage = 'en';
});

test('has no close/back control of its own -- just title, helper, and fields', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  expect(screen.getByText('support.form.title')).toBeInTheDocument();
  expect(screen.getByText('support.form.helper')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'common.close' })).not.toBeInTheDocument();
  expect(screen.queryByText('support.form.backToArticles')).not.toBeInTheDocument();
  assertIconsNeverLeakAsText();
});

test('a registered user sees their name/email prefilled and read-only', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  expect(screen.queryByLabelText('support.form.email')).not.toBeInTheDocument();
});

test('a guest sees their real trip display name read-only, and must type their own email', () => {
  render(<SupportForm tripId="t1" currentMember={guestMember} presetSubject={null} presetSignal={0} />);
  expect(screen.getByText('Guest Traveler')).toBeInTheDocument();
  expect(screen.getByLabelText('support.form.email')).toBeInTheDocument();
});

test('phone and message are required, subject offers exactly the five canonical values', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  expect(screen.getByLabelText('support.form.phone')).toBeRequired();
  expect(screen.getByLabelText('support.form.message')).toBeRequired();
  const options = Array.from(screen.getByLabelText('support.form.subject').querySelectorAll('option')).map((option) => option.value).filter(Boolean);
  expect(options).toEqual(['suggestion', 'inquiry', 'service_request', 'technical_problem', 'other']);
});

test('a presetSubject applied at mount preselects the subject, still changeable', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject="technical_problem" presetSignal={1} />);
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('technical_problem');
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'inquiry' } });
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('inquiry');
});

test('a later presetSignal bump re-applies the preset subject even though the form never remounted (Report a Problem clicked again)', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  const { rerender } = render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'inquiry' } });
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('inquiry');
  rerender(<SupportForm tripId="t1" currentMember={null} presetSubject="technical_problem" presetSignal={1} />);
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('technical_problem');
});

test('selecting Other reveals and requires the custom subject field', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  expect(screen.queryByLabelText('support.form.customSubject')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'other' } });
  expect(screen.getByLabelText('support.form.customSubject')).toBeRequired();
});

test('submitting shows local loading only, disables the button, and prevents a duplicate submit', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  let callCount = 0;
  createSupportTicket.mockImplementation(() => { callCount += 1; return new Promise(() => {}); });
  const { container } = render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fillRequiredFields();
  const submit = screen.getByRole('button', { name: 'support.form.submit' });
  fireEvent.click(submit);
  expect(screen.getByRole('button', { name: 'support.form.submitting' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submitting' }));
  expect(callCount).toBe(1);
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('a successful submission shows the reference and offers "submit another", never navigates away', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockResolvedValue({ reference: 'TS-2026-000123', status: 'new', created_at: '2026-08-30T00:00:00Z' });
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('support.form.successTitle');
  expect(screen.getByText('TS-2026-000123')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'support.form.submitAnother' })).toBeInTheDocument();
  assertIconsNeverLeakAsText();
});

test('"submit another" clears the success state and every field back to empty', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockResolvedValue({ reference: 'TS-2026-000123', status: 'new', created_at: '2026-08-30T00:00:00Z' });
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('support.form.successTitle');
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submitAnother' }));
  expect(screen.queryByText('support.form.successTitle')).not.toBeInTheDocument();
  expect(screen.getByLabelText('support.form.message')).toHaveValue('');
  expect(screen.getByLabelText('support.form.phone')).toHaveValue('');
});

test('server validation errors render near the relevant field, entered values are preserved', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockRejectedValue({ fields: { phone_number: ['Enter a valid phone number.'] } });
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('Enter a valid phone number.');
  expect(screen.getByLabelText('support.form.message')).toHaveValue('A real support message with enough detail.');
});

test('an unexpected (non-field) error shows one generic safe message, never raw exception text', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockRejectedValue({ message: 'Internal Server Error at line 42', fields: {} });
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('support.form.errors.generic');
  expect(screen.queryByText(/line 42/)).not.toBeInTheDocument();
});

test('renders correctly and shows real content under Arabic, with no leaked English icon text', () => {
  mockLanguage = 'ar';
  mockAuthUser = { display_name: 'فهد', email: 'fahad@example.com' };
  render(<SupportForm tripId="t1" currentMember={null} presetSubject={null} presetSignal={0} />);
  expect(screen.getByText('فهد')).toBeInTheDocument();
  assertIconsNeverLeakAsText();
});
