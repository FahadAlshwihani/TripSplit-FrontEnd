/*
  Curated allowlist of @dicebear/styles style IDs — the app only ever
  loads (and only ever CAN load, since avatarGenerator.js's dynamic-import
  map is keyed off exactly these ids) these 16, not the full styles
  package. Kept deliberately short of "all installed styles" per the task
  brief: smaller bundle, consistent visual quality, and every license
  below was individually verified against dicebear.com/licenses (fetched
  2026-08-22) rather than assumed — see docs/AVATAR_SYSTEM.md for the
  full writeup.

  `animated` marks the styles TripSplit offers the (TripSplit-authored,
  CSS-only — see AnimationControl.jsx) motion treatment for. DiceBear
  itself has no animation API; see docs/AVATAR_SYSTEM.md for why this
  isn't a native-DiceBear feature.
*/

export const AVATAR_CATEGORIES = ['all', 'people', 'creatures', 'bots', 'pixel', 'animated'];

export const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Avataaars', category: 'people', animated: false, license: 'Free for personal and commercial use', creator: 'Pablo Stanley' },
  { id: 'lorelei', label: 'Lorelei', category: 'people', animated: false, license: 'CC0 1.0', creator: 'Lisa Wischofsky' },
  { id: 'adventurer', label: 'Adventurer', category: 'people', animated: false, license: 'CC BY 4.0', creator: 'Lisa Wischofsky' },
  { id: 'notionists', label: 'Notionists', category: 'people', animated: false, license: 'CC0 1.0', creator: 'Zoish' },

  { id: 'croodles', label: 'Croodles', category: 'creatures', animated: false, license: 'CC BY 4.0', creator: 'Vijay Verma' },
  { id: 'thumbs', label: 'Thumbs', category: 'creatures', animated: false, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'big-smile', label: 'Big Smile', category: 'creatures', animated: false, license: 'CC BY 4.0', creator: 'Ashley Seo' },

  { id: 'bottts', label: 'Bottts', category: 'bots', animated: false, license: 'Free for personal and commercial use', creator: 'Pablo Stanley' },
  { id: 'bottts-neutral', label: 'Bottts Neutral', category: 'bots', animated: false, license: 'Free for personal and commercial use', creator: 'Pablo Stanley' },

  { id: 'pixel-art', label: 'Pixel Art', category: 'pixel', animated: false, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'pixelbot', label: 'Pixelbot', category: 'pixel', animated: false, license: 'CC0 1.0', creator: 'DiceBear' },

  { id: 'glass', label: 'Glass', category: 'animated', animated: true, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'planets', label: 'Planets', category: 'animated', animated: true, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'shapes', label: 'Shapes', category: 'animated', animated: true, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'waves', label: 'Waves', category: 'animated', animated: true, license: 'CC0 1.0', creator: 'DiceBear' },
  { id: 'loops', label: 'Loops', category: 'animated', animated: true, license: 'CC0 1.0', creator: 'DiceBear' },
];

export const getAvatarStyle = (styleId) => AVATAR_STYLES.find((entry) => entry.id === styleId) || null;

export const stylesForCategory = (category) => (
  category === 'all' ? AVATAR_STYLES : AVATAR_STYLES.filter((entry) => entry.category === category)
);

export const isAnimationCapable = (styleId) => Boolean(getAvatarStyle(styleId)?.animated);
