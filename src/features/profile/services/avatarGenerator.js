/*
  The one place that touches @dicebear/* directly — everything else
  (Avatar.jsx, the onboarding picker) calls generateAvatarDataUri() and
  never imports @dicebear itself. This is also where the whole "no image-
  generation tool / no character-illustration assets, so avatars are
  generated locally" architecture pays for itself: nothing here needs a
  server round trip.

  Every style JSON is behind its own dynamic import(), keyed by id, so a
  page that never touches a "dicebear_*" avatar never downloads
  @dicebear/core or any style definition at all — and a page that renders
  one avatar in one style only pulls that one style's JSON, not all 16.
  Webpack code-splits each import() into its own chunk; results are
  cached in-memory per (style) and per (style, seed, size) so re-renders
  and repeated avatars of the same style/seed are free after the first.
*/

// @dicebear/styles ships its JSON under package.json "exports" subpaths
// (e.g. "@dicebear/styles/lorelei.json") — webpack enforces that map
// strictly (reaching into "dist/*.min.json" directly is a hard build
// error, not just a lint warning), so these paths are the real, correct
// ones. The installed Jest version in this project (27.5.1, from
// react-scripts 5) predates "exports" map resolution and can't follow
// them on its own; package.json's jest.moduleNameMapper redirects these
// same specifiers to the compiled dist files for the test environment
// only, so this file doesn't need two different import forms.
const STYLE_LOADERS = {
  avataaars: () => import('@dicebear/styles/avataaars.json'),
  lorelei: () => import('@dicebear/styles/lorelei.json'),
  adventurer: () => import('@dicebear/styles/adventurer.json'),
  notionists: () => import('@dicebear/styles/notionists.json'),
  croodles: () => import('@dicebear/styles/croodles.json'),
  thumbs: () => import('@dicebear/styles/thumbs.json'),
  'big-smile': () => import('@dicebear/styles/big-smile.json'),
  bottts: () => import('@dicebear/styles/bottts.json'),
  'bottts-neutral': () => import('@dicebear/styles/bottts-neutral.json'),
  'pixel-art': () => import('@dicebear/styles/pixel-art.json'),
  pixelbot: () => import('@dicebear/styles/pixelbot.json'),
  glass: () => import('@dicebear/styles/glass.json'),
  planets: () => import('@dicebear/styles/planets.json'),
  shapes: () => import('@dicebear/styles/shapes.json'),
  waves: () => import('@dicebear/styles/waves.json'),
  loops: () => import('@dicebear/styles/loops.json'),
};

let corePromise = null;
const loadCore = () => {
  if (!corePromise) corePromise = import('@dicebear/core');
  return corePromise;
};

const styleInstanceCache = new Map();
const loadStyleInstance = async (styleId) => {
  const loader = STYLE_LOADERS[styleId];
  if (!loader) throw new Error(`Unknown or non-allowlisted DiceBear style: "${styleId}"`);
  if (!styleInstanceCache.has(styleId)) {
    styleInstanceCache.set(
      styleId,
      Promise.all([loadCore(), loader()]).then(([{ Style }, mod]) => new Style(mod.default)),
    );
  }
  return styleInstanceCache.get(styleId);
};

const dataUriCache = new Map();
const cacheKey = (styleId, seed, size) => `${styleId}::${seed}::${size}`;

// Generates a deterministic SVG avatar as a data: URI — same
// (style, seed, size) always produces the same output (DiceBear's PRNG is
// seeded), so this can be safely memoized and re-requested freely (e.g.
// once per Avatar instance) without wasting work.
export const generateAvatarDataUri = async ({ style, seed, size = 128 }) => {
  const key = cacheKey(style, seed, size);
  if (dataUriCache.has(key)) return dataUriCache.get(key);
  const [{ Avatar }, styleInstance] = await Promise.all([loadCore(), loadStyleInstance(style)]);
  const avatar = new Avatar(styleInstance, { seed, size });
  const dataUri = avatar.toDataUri();
  dataUriCache.set(key, dataUri);
  return dataUri;
};

// Stable, non-guessable, underscore-free (the persisted avatar_key format
// — see Avatar.jsx — joins style/seed/animation with "_", so a seed
// containing "_" would make parsing ambiguous; crypto.randomUUID()'s
// hyphens are stripped for the same reason, not because they'd break
// anything in DiceBear itself).
export const createSeed = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};
