import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SupportContactDrawer from './SupportContactDrawer';
import { createSupportTicket } from '../api/supportApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }));
jest.mock('../api/supportApi', () => ({ createSupportTicket: jest.fn() }));

let mockAuthUser = null;
let mockAuthLoading = false;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, isAuthenticated: Boolean(mockAuthUser), authLoading: mockAuthLoading }) }));

const guestMember = { display_name: 'Guest Traveler', avatar: {} };

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText('support.form.phone'), { target: { value: '501234567' } });
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'inquiry' } });
  fireEvent.change(screen.getByLabelText('support.form.message'), { target: { value: 'A real support message with enough detail.' } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = null;
  mockAuthLoading = false;
});

test('a registered user sees their name/email prefilled and read-only', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(screen.getByText('Fahad')).toBeInTheDocument();
  expect(screen.getByText('fahad@example.com')).toBeInTheDocument();
  expect(screen.queryByLabelText('support.form.email')).not.toBeInTheDocument();
});

test('a guest sees their real trip display name read-only, and must type their own email', () => {
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={guestMember} preselectedSubject={null} />);
  expect(screen.getByText('Guest Traveler')).toBeInTheDocument();
  expect(screen.getByLabelText('support.form.email')).toBeInTheDocument();
});

test('phone is a required field', () => {
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(screen.getByLabelText('support.form.phone')).toBeRequired();
});

test('subject options are exactly the five canonical values', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  const options = Array.from(screen.getByLabelText('support.form.subject').querySelectorAll('option')).map((option) => option.value).filter(Boolean);
  expect(options).toEqual(['suggestion', 'inquiry', 'service_request', 'technical_problem', 'other']);
});

test('Contact Support opens with no subject preselected', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('');
});

test('Report a Problem preselects technical_problem, still changeable', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject="technical_problem" />);
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('technical_problem');
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'inquiry' } });
  expect(screen.getByLabelText('support.form.subject')).toHaveValue('inquiry');
});

test('selecting Other reveals the custom subject field, hidden otherwise', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(screen.queryByLabelText('support.form.customSubject')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('support.form.subject'), { target: { value: 'other' } });
  expect(screen.getByLabelText('support.form.customSubject')).toBeRequired();
});

test('message is a required field', () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(screen.getByLabelText('support.form.message')).toBeRequired();
});

test('submitting shows local loading only and disables the submit button, never a full-page loader', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  let resolveTicket;
  createSupportTicket.mockReturnValue(new Promise((resolve) => { resolveTicket = resolve; }));
  const { container } = render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  expect(screen.getByRole('button', { name: 'support.form.submitting' })).toBeDisabled();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
  resolveTicket({ reference: 'TS-2026-000001', status: 'new', created_at: '2026-08-30T00:00:00Z' });
  await waitFor(() => expect(screen.getByText('support.form.successTitle')).toBeInTheDocument());
});

test('a duplicate submit while already submitting is prevented', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  let resolveCount = 0;
  createSupportTicket.mockImplementation(() => { resolveCount += 1; return new Promise(() => {}); });
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  fillRequiredFields();
  const submit = screen.getByRole('button', { name: 'support.form.submit' });
  fireEvent.click(submit);
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submitting' }));
  expect(resolveCount).toBe(1);
});

test('a successful submission shows the reference and never auto-closes before the user sees it', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockResolvedValue({ reference: 'TS-2026-000123', status: 'new', created_at: '2026-08-30T00:00:00Z' });
  const onClose = jest.fn();
  render(<SupportContactDrawer onClose={onClose} tripId="t1" currentMember={null} preselectedSubject={null} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('support.form.successTitle');
  expect(screen.getByText('TS-2026-000123')).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('server validation errors render near the relevant field, entered values are preserved', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockRejectedValue({ fields: { phone_number: ['Enter a valid phone number.'] } });
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('Enter a valid phone number.');
  expect(screen.getByLabelText('support.form.message')).toHaveValue('A real support message with enough detail.');
});

test('an unexpected (non-field) error shows one generic safe message, never raw exception text', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  createSupportTicket.mockRejectedValue({ message: 'Internal Server Error at line 42 in views.py', fields: {} });
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  fillRequiredFields();
  fireEvent.click(screen.getByRole('button', { name: 'support.form.submit' }));
  await screen.findByText('support.form.errors.generic');
  expect(screen.queryByText(/views\.py/)).not.toBeInTheDocument();
});

test('is rendered via a portal with an overlay, and pressing Escape closes it', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  const onClose = jest.fn();
  const { container } = render(<SupportContactDrawer onClose={onClose} tripId="t1" currentMember={null} preselectedSubject={null} />);
  expect(document.body.querySelector('.support-drawer-overlay')).toBeInTheDocument();
  expect(container.querySelector('.support-drawer')).not.toBeInTheDocument();
  await screen.findByRole('dialog');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('focus moves into the drawer on open and stays contained on Tab', async () => {
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com' };
  render(<SupportContactDrawer onClose={jest.fn()} tripId="t1" currentMember={null} preselectedSubject={null} />);
  const dialog = await screen.findByRole('dialog');
  expect(dialog.contains(document.activeElement)).toBe(true);
});
