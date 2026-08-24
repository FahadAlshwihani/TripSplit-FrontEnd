import { loadGuestProfile, saveGuestProfile, clearGuestProfile } from './guestProfileStore';

beforeEach(() => localStorage.clear());

test('returns null when nothing has been saved yet', () => {
  expect(loadGuestProfile()).toBeNull();
});

test('saves and reloads a guest profile with a stable local_profile_id', () => {
  const saved = saveGuestProfile({ display_name: 'Fahad', avatar_type: 'initials', avatar_color: 'indigo' });
  expect(saved.local_profile_id).toBeTruthy();
  expect(saved.created_at).toBe(saved.updated_at);

  const loaded = loadGuestProfile();
  expect(loaded.display_name).toBe('Fahad');
  expect(loaded.avatar_color).toBe('indigo');
});

test('re-saving keeps the same local_profile_id and created_at, but updates updated_at', () => {
  const first = saveGuestProfile({ display_name: 'Fahad', avatar_type: 'initials', avatar_color: 'indigo' });
  const second = saveGuestProfile({ display_name: 'Fahad Updated', avatar_type: 'initials', avatar_color: 'sage' });
  expect(second.local_profile_id).toBe(first.local_profile_id);
  expect(second.created_at).toBe(first.created_at);
  expect(second.display_name).toBe('Fahad Updated');
  expect(second.avatar_color).toBe('sage');
});

test('clearGuestProfile removes the saved profile', () => {
  saveGuestProfile({ display_name: 'Fahad', avatar_key: 'avatar_02' });
  clearGuestProfile();
  expect(loadGuestProfile()).toBeNull();
});

test('malformed stored JSON is treated as no profile rather than throwing', () => {
  localStorage.setItem('tripsplit:guest-profile', '{not-json');
  expect(loadGuestProfile()).toBeNull();
});
