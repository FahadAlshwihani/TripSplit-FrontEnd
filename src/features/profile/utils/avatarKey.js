/*
  "avatar_key" (the "initials_<colorId>" / "dicebear_<style>_<seed>_
  <animation>" encoding below) is now purely an INTERNAL representation
  used to feed the canonical <Avatar avatarKey=.../> renderer — it is no
  longer what's sent to the backend. The backend has its own structured
  fields (avatar_type/avatar_color/avatar_style/avatar_seed/
  avatar_animation — see PATCH /profile/) since a DiceBear seed alone is
  32 chars and doesn't fit the legacy 20-char avatar_key column that this
  encoding used to be squeezed into. buildAvatarPayload()/avatarKeyFromUser()
  below are the two conversion points between this local encoding and the
  backend's wire shape.

    "initials_<colorId>"                      e.g. initials_indigo
    "dicebear_<style>_<seed>_<animation>"      e.g. dicebear_lorelei_a1b2c3_slow

  Seeds are generated underscore-free (see createSeed() in
  avatarGenerator.js) specifically so a plain split('_') is unambiguous;
  style ids only ever contain letters/hyphens (see avatarCatalog.js), so
  they never collide with the "_" delimiter either.
*/

export const ANIMATION_LEVELS = ['none', 'slow', 'medium', 'fast'];

export const INITIALS_PREFIX = 'initials_';
export const DICEBEAR_PREFIX = 'dicebear_';

export const encodeInitialsKey = (colorId) => `${INITIALS_PREFIX}${colorId}`;

export const encodeDicebearKey = ({ style, seed, animation = 'none' }) => (
  `${DICEBEAR_PREFIX}${style}_${seed}_${ANIMATION_LEVELS.includes(animation) ? animation : 'none'}`
);

// Returns { style, seed, animation } or null if avatarKey isn't a
// well-formed "dicebear_*" key.
export const decodeDicebearKey = (avatarKey) => {
  if (!avatarKey?.startsWith(DICEBEAR_PREFIX)) return null;
  const parts = avatarKey.slice(DICEBEAR_PREFIX.length).split('_');
  if (parts.length !== 3) return null;
  const [style, seed, animation] = parts;
  if (!style || !seed) return null;
  return { style, seed, animation: ANIMATION_LEVELS.includes(animation) ? animation : 'none' };
};

export const decodeInitialsKey = (avatarKey) => (
  avatarKey?.startsWith(INITIALS_PREFIX) ? avatarKey.slice(INITIALS_PREFIX.length) : null
);

// Builds the semantic PATCH /profile/ payload from onboarding picker state
// — only the fields relevant to the selected mode are sent; the backend
// clears the other mode's stale fields server-side on save.
export const buildAvatarPayload = ({ mode, colorId, selected, animation }) => (
  mode === 'initials'
    ? { avatar_type: 'initials', avatar_color: colorId }
    : { avatar_type: 'dicebear', avatar_style: selected.style, avatar_seed: selected.seed, avatar_animation: animation }
);

// Reconstructs the local avatarKey encoding from a backend user object's
// structured avatar_* fields, so the canonical Avatar component can render
// the current user's own avatar (e.g. Profile settings, header) purely from
// what the backend persisted — never from transient picker/session state.
// Falls back to the legacy avatar_key string for avatar_type "legacy".
export const avatarKeyFromUser = (user) => {
  if (!user) return '';
  if (user.avatar_type === 'dicebear' && user.avatar_style && user.avatar_seed) {
    return encodeDicebearKey({ style: user.avatar_style, seed: user.avatar_seed, animation: user.avatar_animation || 'none' });
  }
  if (user.avatar_type === 'initials' && user.avatar_color) {
    return encodeInitialsKey(user.avatar_color);
  }
  return user.avatar_key || '';
};

// Same idea as avatarKeyFromUser(), but for the canonical `avatar` object
// every trip-member-facing endpoint now exposes (MemberSerializer,
// JoinRequestSerializer, funds/balances APIs — see apps.accounts.avatars.
// avatar_payload on the backend):
//   {type: "dicebear", style, seed, animation} | {type: "initials", color}
//   | {type: "legacy", key}
// A registered member's avatar here always reflects their CURRENT profile
// (derived server-side at read time), not a stale snapshot from when they
// joined — so this is the one shape every trip surface (members, activity,
// governance, funds) should render through, instead of reading a raw
// avatar_key.
export const avatarKeyFromAvatar = (avatar) => {
  if (!avatar) return '';
  if (avatar.type === 'dicebear' && avatar.style && avatar.seed) {
    return encodeDicebearKey({ style: avatar.style, seed: avatar.seed, animation: avatar.animation || 'none' });
  }
  if (avatar.type === 'initials' && avatar.color) {
    return encodeInitialsKey(avatar.color);
  }
  return avatar.key || '';
};
