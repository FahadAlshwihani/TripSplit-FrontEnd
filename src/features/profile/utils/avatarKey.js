/*
  avatar_key stays the single backend-facing field (no schema/migration
  needed — see docs/AVATAR_SYSTEM.md "Persistence" section for why this
  was chosen over adding avatar_type/avatar_style/avatar_seed/
  avatar_animation as separate fields): every mode's config is encoded
  into that one string, and this module is the only place that builds or
  parses the encoding.

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
