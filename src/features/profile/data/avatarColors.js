// Curated background palette for initials-mode avatars. Fixed set (no
// free-form color picker per this phase's scope) — the `id` is what gets
// persisted on avatar_key (as `initials_<id>`), `token` is the CSS custom
// property the swatch/preview render with, so the palette lives in one
// place (tokens.css) rather than being duplicated as hex here.
export const AVATAR_COLORS = [
  { id: 'indigo', token: 'var(--avatar-indigo)', labelKey: 'profile.setup.colors.indigo' },
  { id: 'slate', token: 'var(--avatar-slate)', labelKey: 'profile.setup.colors.slate' },
  { id: 'charcoal', token: 'var(--avatar-charcoal)', labelKey: 'profile.setup.colors.charcoal' },
  { id: 'coral', token: 'var(--avatar-coral)', labelKey: 'profile.setup.colors.coral' },
  { id: 'sage', token: 'var(--avatar-sage)', labelKey: 'profile.setup.colors.sage' },
  { id: 'mustard', token: 'var(--avatar-mustard)', labelKey: 'profile.setup.colors.mustard' },
];

export const DEFAULT_AVATAR_COLOR_ID = 'indigo';

export const avatarColorToken = (colorId) => AVATAR_COLORS.find((c) => c.id === colorId)?.token
  || AVATAR_COLORS.find((c) => c.id === DEFAULT_AVATAR_COLOR_ID).token;
