import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import TripSettingsPage from './TripSettingsPage';
import { archiveTrip, restoreTrip, updateTrip } from '../api/tripsApi';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, opts) => (opts ? `${key}:${JSON.stringify(opts)}` : key), i18n: { language: 'en' } }) }));
jest.mock('../api/tripsApi', () => ({ updateTrip: jest.fn(), archiveTrip: jest.fn(), restoreTrip: jest.fn() }));
let mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' };
let mockAuthLoading = false;
jest.mock('../../../auth/AuthContext', () => ({ useAuth: () => ({ user: mockAuthUser, isAuthenticated: Boolean(mockAuthUser), authLoading: mockAuthLoading }) }));
jest.mock('../../../shared/components/CurrencyPicker', () => ({ id, value, onChange, label }) => (
  <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="SAR">SAR</option>
    <option value="USD">USD</option>
    <option value="EUR">EUR</option>
  </select>
));

const editPermissions = { canEditTrip: true, canArchiveTrip: true, canRestoreTrip: false, canManageMembers: true };
const readOnlyMemberPermissions = { canEditTrip: false, canArchiveTrip: false, canRestoreTrip: false };

const baseTrip = {
  title: 'Georgia Winter Trip',
  short_code: 'short-1',
  join_code: 'ABCD1234',
  currency: 'SAR',
  currency_locked: false,
  start_date: '2026-10-01',
  end_date: '2026-10-10',
  join_policy: 'open',
  password_protected: false,
  archived_at: null,
  lifecycle_status: 'active',
};

const renderPage = (ctxOverrides = {}) => {
  const setTrip = ctxOverrides.setTrip || jest.fn();
  const utils = render(
    <MemoryRouter initialEntries={['/trips/t1/settings']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip, tripId: 't1', permissions: editPermissions, ...ctxOverrides }} />}>
          <Route path="settings" element={<TripSettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return { ...utils, setTrip };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthUser = { display_name: 'Fahad', email: 'fahad@example.com', avatar_key: 'avatar_01' };
  mockAuthLoading = false;
});

test('the title and every section shell render immediately -- there is no data fetch, so no loading placeholder at all', () => {
  const { container } = renderPage();
  expect(screen.getByText('settings.title')).toBeInTheDocument();
  expect(screen.getByText('settings.general.title')).toBeInTheDocument();
  expect(screen.getByText('settings.access.title')).toBeInTheDocument();
  expect(screen.getByText('settings.settlement.title')).toBeInTheDocument();
  expect(container.querySelector('.section-loading')).not.toBeInTheDocument();
  expect(container.querySelector('.neo-loading')).not.toBeInTheDocument();
});

test('no budget field appears anywhere on the page', () => {
  renderPage();
  expect(screen.queryByText('trip.budget')).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/budget/i)).not.toBeInTheDocument();
});

test('Save Changes stays disabled until a field actually changes', () => {
  renderPage();
  const save = screen.getByRole('button', { name: 'common.saveChanges' });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Renamed Trip' } });
  expect(save).not.toBeDisabled();
});

test('saving sends only the fields that actually changed, never a budget key', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, title: 'Renamed Trip' });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Renamed Trip' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { title: 'Renamed Trip' }));
  const payload = updateTrip.mock.calls[0][1];
  expect(payload).not.toHaveProperty('budget');
  expect(payload).not.toHaveProperty('password');
});

test('an empty trip name is rejected client-side before any API call', () => {
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  expect(screen.getByText('settings.errors.titleRequired')).toBeInTheDocument();
  expect(updateTrip).not.toHaveBeenCalled();
});

test('an end date before the start date is rejected client-side', () => {
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.endDate'), { target: { value: '2026-01-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  expect(screen.getByText('settings.errors.endBeforeStart')).toBeInTheDocument();
  expect(updateTrip).not.toHaveBeenCalled();
});

test('currency is locked read-only once the trip has financial activity, with an explanatory hint', () => {
  renderPage({ trip: { ...baseTrip, currency_locked: true } });
  expect(screen.queryByLabelText('settings.general.currency')).not.toBeInTheDocument();
  expect(screen.getByText('settings.general.currencyLockedHint')).toBeInTheDocument();
  expect(screen.getAllByText('SAR').length).toBeGreaterThan(0);
});

test('currency is editable when the trip has no financial activity yet', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, currency: 'USD' });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.currency'), { target: { value: 'USD' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { currency: 'USD' }));
});

test('join policy renders the three real backend states and persists a change', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, join_policy: 'invite_only' });
  renderPage();
  expect(screen.getByLabelText(/^joinPolicy\.open/)).toBeChecked();
  fireEvent.click(screen.getByLabelText(/^joinPolicy\.invite_only/));
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { join_policy: 'invite_only' }));
});

test('a rejected/invalid password is never sent unless the user actually typed a new one', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, title: 'Renamed' });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalled());
  expect(updateTrip.mock.calls[0][1]).not.toHaveProperty('password');
});

test('typing a new password includes it in the save payload', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, password_protected: true });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.access.password'), { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { password: 'secret123' }));
});

test('removing password protection is a separate, explicitly confirmed action -- not bundled into Save', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, password_protected: false });
  renderPage({ trip: { ...baseTrip, password_protected: true } });
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.removePassword' }));
  expect(updateTrip).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'settings.access.removePassword' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalledWith('t1', { password: '' }));
});

test('Simplify Debts is shown checked and locked, never a live toggle', () => {
  renderPage();
  const checkbox = screen.getByLabelText('settings.settlement.simplifyDebts');
  expect(checkbox).toBeChecked();
  expect(checkbox).toBeDisabled();
});

test('Require Receipts is Coming Soon -- disabled and never sent in the save payload', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, title: 'Renamed' });
  renderPage();
  const checkbox = screen.getByLabelText('settings.settlement.requireReceipts');
  expect(checkbox).toBeDisabled();
  expect(screen.getByText('common.comingSoon')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(updateTrip).toHaveBeenCalled());
  expect(updateTrip.mock.calls[0][1]).not.toHaveProperty('require_receipts');
});

test('a plain member without edit capability sees read-only values, no inputs, and no Save button', () => {
  renderPage({ permissions: readOnlyMemberPermissions });
  expect(screen.queryByLabelText('settings.general.name')).not.toBeInTheDocument();
  expect(screen.getByText('Georgia Winter Trip')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'common.saveChanges' })).not.toBeInTheDocument();
});

test('Archive requires confirmation before calling the API', async () => {
  archiveTrip.mockResolvedValue(undefined);
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'trip.archive' }));
  expect(archiveTrip).not.toHaveBeenCalled();
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'trip.archive' }));
  await waitFor(() => expect(archiveTrip).toHaveBeenCalledWith('t1'));
});

test('a viewer without archive capability never sees the Archive button', () => {
  renderPage({ permissions: { ...editPermissions, canArchiveTrip: false } });
  expect(screen.queryByRole('button', { name: 'trip.archive' })).not.toBeInTheDocument();
});

test('an archived trip shows Restore instead of Archive, for a viewer with restore capability', () => {
  renderPage({
    trip: { ...baseTrip, archived_at: '2026-08-01T00:00:00Z' },
    permissions: { canEditTrip: false, canArchiveTrip: false, canRestoreTrip: true },
  });
  expect(screen.getByRole('button', { name: 'trip.restore' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'trip.archive' })).not.toBeInTheDocument();
});

test('restoring calls the restore API and applies the returned trip', async () => {
  const restored = { ...baseTrip, archived_at: null };
  restoreTrip.mockResolvedValue(restored);
  const { setTrip } = renderPage({
    trip: { ...baseTrip, archived_at: '2026-08-01T00:00:00Z' },
    permissions: { canEditTrip: false, canArchiveTrip: false, canRestoreTrip: true },
  });
  fireEvent.click(screen.getByRole('button', { name: 'trip.restore' }));
  const dialog = await screen.findByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'trip.restore' }));
  await waitFor(() => expect(restoreTrip).toHaveBeenCalledWith('t1'));
  await waitFor(() => expect(setTrip).toHaveBeenCalledWith(restored));
});

test('a save failure keeps the draft values intact instead of wiping the form', async () => {
  updateTrip.mockRejectedValue(new Error('network down'));
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Still Editing' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  await waitFor(() => expect(screen.getByText('network down')).toBeInTheDocument());
  expect(screen.getByLabelText('settings.general.name')).toHaveValue('Still Editing');
});

test('a successful save shows transient success feedback', async () => {
  updateTrip.mockResolvedValue({ ...baseTrip, title: 'Renamed' });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.general.name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'common.saveChanges' }));
  expect(await screen.findByText('settings.saveSuccess')).toBeInTheDocument();
});

test('Quick Jump renders anchor links for General, Access, and Settlements', () => {
  renderPage();
  expect(screen.getByText('settings.quickJump.title')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /settings\.quickJump\.general/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /settings\.quickJump\.access/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /settings\.quickJump\.settlements/ })).toBeInTheDocument();
});

test('renders correctly under RTL', () => {
  const { container } = render(
    <div dir="rtl">
      <MemoryRouter initialEntries={['/trips/t1/settings']}>
        <Routes>
          <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip: jest.fn(), tripId: 't1', permissions: editPermissions }} />}>
            <Route path="settings" element={<TripSettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>,
  );
  expect(screen.getByText('settings.title')).toBeInTheDocument();
  expect(container.querySelector('.set-page')).toBeInTheDocument();
});

test('an unchanged save is never triggered -- the button stays disabled with no dirty fields', () => {
  renderPage();
  expect(screen.getByRole('button', { name: 'common.saveChanges' })).toBeDisabled();
  expect(updateTrip).not.toHaveBeenCalled();
});

// --- Password visibility, copy, and the share-message action -------

test('the eye toggle reveals the typed password (type switches to text) and back to hidden, with correct aria labels', () => {
  renderPage();
  const input = screen.getByLabelText('settings.access.password');
  fireEvent.change(input, { target: { value: 'hunter2' } });
  expect(input).toHaveAttribute('type', 'password');
  const toggle = screen.getByRole('button', { name: 'settings.access.showPassword' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(toggle);
  expect(input).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: 'settings.access.hidePassword' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.hidePassword' }));
  expect(input).toHaveAttribute('type', 'password');
});

test('the eye toggle button never submits the form', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.showPassword' }));
  expect(updateTrip).not.toHaveBeenCalled();
});

test('the copy-password action only appears once a password has actually been typed', () => {
  renderPage();
  expect(screen.queryByRole('button', { name: 'settings.access.copyPassword' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('settings.access.password'), { target: { value: 'hunter2' } });
  expect(screen.getByRole('button', { name: 'settings.access.copyPassword' })).toBeInTheDocument();
});

test('copy-password copies exactly the typed value, via clipboard only (never Web Share), with the correct feedback', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const share = jest.fn();
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.access.password'), { target: { value: 'hunter2' } });
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.copyPassword' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith('hunter2'));
  expect(share).not.toHaveBeenCalled();
  expect(await screen.findByText('settings.access.passwordCopied')).toBeInTheDocument();
});

test('the copy-invite-message action is always available to an editor, building the message from the current draft join policy and password', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.copyInviteMessage' }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  const copied = writeText.mock.calls[0][0];
  expect(copied).toContain('share.join.open');
  expect(copied).toContain('Georgia Winter Trip');
  expect(copied).toContain('/trips/join?code=ABCD1234');
  expect(copied).not.toContain('short-1');
  expect(await screen.findByText('common.inviteMessageCopied')).toBeInTheDocument();
});

test('the invite message includes the typed draft password once one exists, and switches template key accordingly', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  renderPage();
  fireEvent.change(screen.getByLabelText('settings.access.password'), { target: { value: 'hunter2' } });
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.copyInviteMessage' }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  const copied = writeText.mock.calls[0][0];
  expect(copied).toContain('share.join.openWithPassword');
  expect(copied).toContain('hunter2');
});

test('changing the draft join policy is reflected in the invite message template key immediately', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  renderPage();
  fireEvent.click(screen.getByLabelText(/^joinPolicy\.invite_only/));
  fireEvent.click(screen.getByRole('button', { name: 'settings.access.copyInviteMessage' }));
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(writeText.mock.calls[0][0]).toContain('share.join.invite_only');
});

test('a read-only viewer (no edit capability) sees neither the eye toggle nor any password/invite-message action', () => {
  renderPage({ permissions: readOnlyMemberPermissions });
  expect(screen.queryByRole('button', { name: 'settings.access.showPassword' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'settings.access.copyInviteMessage' })).not.toBeInTheDocument();
});

// --- Left column order + password icon geometry ---------------------

test('left column order is Quick Jump, Danger Zone, Account, Preferences', () => {
  const { container } = renderPage();
  const left = container.querySelector('.set-grid__left');
  const order = ['set-quick-jump', 'set-danger-card', 'set-account-card', 'set-preferences-card'].map(
    (cls) => Array.from(left.querySelectorAll(`.${cls}`))[0],
  );
  order.forEach((el) => expect(el).toBeInTheDocument());
  for (let i = 1; i < order.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

test('password field renders exactly one leading (decorative) icon and one trailing (interactive) eye toggle, on different elements', () => {
  const { container } = renderPage();
  const field = container.querySelector('.set-password-field');
  const icon = field.querySelector('.set-password-field__icon');
  const toggle = field.querySelector('.set-password-field__toggle');
  expect(icon).toBeInTheDocument();
  expect(toggle).toBeInTheDocument();
  expect(icon).not.toBe(toggle);
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(toggle.tagName).toBe('BUTTON');
});

// --- Password field RTL/LTR geometry contract ------------------------
// jsdom doesn't implement the [dir]->direction UA mapping, so computed
// pixel positions can't be asserted here -- these test the underlying
// contract that actually drives correct rendering in a real browser:
// the wrapper never has a hardcoded dir (so it inherits page
// direction either way), the value itself is always forced LTR, and
// the lock icon's positioning wrapper is never the same element as
// its Material-Symbols glyph (see settingsPolish.test.js for why that
// split matters -- the glyph forces its own direction: ltr, which
// would otherwise hijack inset-inline-start).
const renderWithDir = (dir) => render(
  <div dir={dir}>
    <MemoryRouter initialEntries={['/trips/t1/settings']}>
      <Routes>
        <Route path="/trips/:tripId" element={<Outlet context={{ trip: baseTrip, setTrip: jest.fn(), tripId: 't1', permissions: editPermissions }} />}>
          <Route path="settings" element={<TripSettingsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  </div>,
);

test.each(['rtl', 'ltr'])('password field geometry contract holds identically under dir=%s (same markup, no per-locale branch)', (dir) => {
  const { container } = renderWithDir(dir);
  const field = container.querySelector('.set-password-field');
  const icon = field.querySelector('.set-password-field__icon');
  const iconGlyph = icon.querySelector('.material-symbols-outlined');
  const toggle = field.querySelector('.set-password-field__toggle');
  const input = field.querySelector('input');

  // Wrapper and icon carry no hardcoded dir -- they inherit the page's.
  expect(field.getAttribute('dir')).toBeNull();
  expect(icon.getAttribute('dir')).toBeNull();
  // The value itself is always forced LTR, regardless of page direction.
  expect(input).toHaveAttribute('dir', 'ltr');
  // The glyph (forced-ltr for correct ligature rendering) is a CHILD of
  // the positioning wrapper, never the same element -- so
  // inset-inline-start on the wrapper resolves against the page's
  // direction, not the glyph's.
  expect(iconGlyph).toBeInTheDocument();
  expect(icon).not.toBe(iconGlyph);
  expect(icon.className).not.toMatch(/material-symbols-outlined/);
  // Icon and toggle are distinct elements at opposite logical edges
  // (inset-inline-start / inset-inline-end -- see settings.css).
  expect(icon).not.toBe(toggle);
});

// --- Settlement rule rows + Preferences control sizing ---------------

test('both settlement rule rows carry the canonical option-row depth class', () => {
  const { container } = renderPage();
  expect(container.querySelectorAll('.set-rule').length).toBe(2);
});

test('Language and Theme selects render with the exact same control class -- one shared geometry', () => {
  const { getByLabelText } = renderPage();
  const language = getByLabelText('settings.preferences.language');
  const theme = getByLabelText('settings.preferences.theme');
  expect(language.className).toBe('set-preferences-card__select');
  expect(theme.className).toBe(language.className);
});

// --- Join Policy container + locked Base Currency: restored depth ----

test('the Join Policy radiogroup renders inside the canonical depth container', () => {
  const { container } = renderPage();
  const group = screen.getByRole('radiogroup');
  expect(group).toHaveClass('set-join-policy');
  expect(container.querySelector('.set-join-policy')).toBe(group);
});

test('a locked Base Currency renders through the canonical depth-carrying read-only class', () => {
  const { container } = renderPage({ trip: { ...baseTrip, currency_locked: true } });
  const currencyField = screen.getByText('settings.general.currency').closest('.field-group');
  const readonly = currencyField.querySelector('.set-readonly-value');
  expect(readonly).toBeInTheDocument();
  expect(readonly).toHaveTextContent('SAR');
  expect(container.querySelectorAll('.set-readonly-value')).toContain(readonly);
});

// --- Lock icon stability: always mounted, never conditionally removed -

test('the lock icon stays mounted across empty, valued, focused, blurred, and visibility-toggled states', () => {
  const { container } = renderPage();
  const getIcon = () => container.querySelector('.set-password-field__icon .material-symbols-outlined');
  const input = screen.getByLabelText('settings.access.password');

  expect(getIcon()).toBeInTheDocument();
  expect(getIcon()).toHaveTextContent('lock');

  fireEvent.focus(input);
  expect(getIcon()).toBeInTheDocument();

  fireEvent.change(input, { target: { value: 'hunter2' } });
  expect(getIcon()).toBeInTheDocument();

  fireEvent.blur(input);
  expect(getIcon()).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'settings.access.showPassword' }));
  expect(getIcon()).toBeInTheDocument();

  fireEvent.change(input, { target: { value: '' } });
  expect(getIcon()).toBeInTheDocument();
});
