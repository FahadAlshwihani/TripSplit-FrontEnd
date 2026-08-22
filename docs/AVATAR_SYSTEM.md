# Avatar System

TripSplit's avatar system has two modes: **Initials** (a colored monogram
computed live from the member's display name) and **Avatars**, generated
locally from a curated allowlist of [DiceBear](https://www.dicebear.com)
styles. Nothing is uploaded, stored as a blob, or fetched from a remote
avatar API at runtime — every avatar is a deterministic SVG generated
in-browser from a `(style, seed)` pair.

## Packages

- `@dicebear/core` — `^10.6.1`
- `@dicebear/styles` — `^10.5.0`

Both are real npm dependencies (see `package.json`), not assumed. The
current v10 API differs from older DiceBear versions people may
remember: there's no `createAvatar()` helper — you construct
`new Style(definition)` then `new Avatar(style, options)`, and each
style's data is its own JSON file imported via a package `exports`
subpath (`@dicebear/styles/lorelei.json`), not a JS module per style.

## Why local generation, not the public API

The public `api.dicebear.com` HTTP endpoint was deliberately not used.
Local generation means avatars work with no network dependency, no rate
limit, no third party seeing which seed/style a user picked, and no
extra round-trip latency — the trade-off is that the style JSON has to
ship to the browser, which is why loading is lazy and per-style (next
section).

## Bundle strategy — why nothing loads until it's needed

`src/features/profile/services/avatarGenerator.js` is the **only** file
that imports `@dicebear/*`. Every style is behind its own
`import('@dicebear/styles/<id>.json')`, keyed by id in a lookup map, and
`@dicebear/core` itself is loaded the same way. Consequences:

- A page that never renders a `dicebear_*` avatar (most of the app, most
  of the time) never downloads any of this code.
- A page that renders one avatar in one style only downloads that one
  style's chunk plus the core chunk — not all 16 styles.
- Webpack code-splits each `import()` into its own chunk automatically;
  no manual `React.lazy()` was needed for this because the weight was
  never in the *components* (tiny JSX files) — it's in the DiceBear data,
  which was already lazy at the data-loading layer. Explicit
  `React.lazy()` around the picker components would have been a second
  layer of laziness with no real bundle-size benefit on top of this.
- Every generated SVG (keyed by `style::seed::size`) and every loaded
  `Style` instance is memoized in-memory, so repeated avatars (e.g. the
  same seed showing in a member list and in onboarding) don't regenerate
  or re-fetch.

### Measured impact

| | gzip size |
|---|---|
| `main.js`, before this feature | 155.2 kB |
| `main.js`, after (DiceBear installed + fully wired in) | 159.4 kB |

The DiceBear ecosystem itself (core + all 16 curated styles, combined)
landed in separate on-demand chunks outside `main.js` — those only
download the first time a user actually opens the "Avatars" tab, or
views a member whose avatar_key is `dicebear_*`.

## Test-environment note

The Jest version bundled with `react-scripts 5` (Jest 27.5.1) predates
full support for package.json `"exports"` map resolution, so it can't
resolve `@dicebear/styles/lorelei.json` on its own even though webpack
(and Node's own `require.resolve`) can. `package.json`'s
`jest.moduleNameMapper` redirects those same specifiers to the compiled
`dist/*.min.json` files for the test environment only — the *source*
code always uses the real, webpack-correct `exports` subpath, so there's
only one import form to reason about, not two.

Separately, `@dicebear/core` calls the standard `structuredClone` global
internally, which jsdom's Jest 27 test environment doesn't provide (real
browsers, and Node 17+, both have it) — polyfilled in `src/setupTests.js`
using the same `v8.serialize`/`deserialize` technique Node's own
`structuredClone` implementation uses.

## Curated style allowlist

Only 16 of DiceBear's ~50 styles are enabled — an explicit allowlist in
`src/features/profile/data/avatarCatalog.js`, not "all installed
styles," to keep the bundle small, the visual quality consistent, and
every license individually known rather than assumed. Every license
below was verified against
[dicebear.com/licenses](https://www.dicebear.com/licenses/) (fetched
2026-08-22), not guessed from memory.

| Style | Category | License | Creator | Attribution needed? |
|---|---|---|---|---|
| avataaars | People | Free for personal and commercial use | Pablo Stanley | No |
| lorelei | People | CC0 1.0 | Lisa Wischofsky | No |
| adventurer | People | CC BY 4.0 | Lisa Wischofsky | **Yes** |
| notionists | People | CC0 1.0 | Zoish | No |
| croodles | Creatures | CC BY 4.0 | Vijay Verma | **Yes** |
| thumbs | Creatures | CC0 1.0 | DiceBear | No |
| big-smile | Creatures | CC BY 4.0 | Ashley Seo | **Yes** |
| bottts | Bots | Free for personal and commercial use | Pablo Stanley | No |
| bottts-neutral | Bots | Free for personal and commercial use | Pablo Stanley | No |
| pixel-art | Pixel | CC0 1.0 | DiceBear | No |
| pixelbot | Pixel | CC0 1.0 | DiceBear | No |
| glass | Animated | CC0 1.0 | DiceBear | No |
| planets | Animated | CC0 1.0 | DiceBear | No |
| shapes | Animated | CC0 1.0 | DiceBear | No |
| waves | Animated | CC0 1.0 | DiceBear | No |
| loops | Animated | CC0 1.0 | DiceBear | No |

**CC BY 4.0 attribution requirement**: DiceBear's own generated SVG
output already embeds an RDF/Dublin Core metadata block crediting the
original creator and linking the license inside every SVG it produces
(visible in the raw markup, not visually rendered) — the library does
this automatically for every style regardless of license. This document
is TripSplit's additional project-level attribution for the three CC BY
4.0 styles above (Adventurer/Lisa Wischofsky, Croodles/Vijay Verma, Big
Smile/Ashley Seo), satisfying the "must credit" term of that license.

**To add a style later**: add one entry to `AVATAR_STYLES` in
`avatarCatalog.js` and one loader line to `STYLE_LOADERS` in
`avatarGenerator.js` — verify its license on dicebear.com/licenses first
and record it in both the catalog entry and the table above.

## Categories

`ALL / PEOPLE / CREATURES / BOTS / PIXEL / ANIMATED` — `AVATAR_CATEGORIES`
in `avatarCatalog.js`. `ANIMATED` is a curated subset of styles
TripSplit offers the CSS animation treatment for (see next section), not
a DiceBear concept.

## Animation — TripSplit-authored, not a DiceBear feature

**This is the most important thing to understand about this system**:
DiceBear v10's `Options` class (the full set of every generation
parameter the library accepts — seed, size, colors, flips, rotation,
scale, etc.) has no animation-related option at all. There is no
`animationVariant`, no "slowest/slow/medium/fast/fastest" concept, and
no animated-SVG output mode in the installed package. This was verified
directly against the installed package's source
(`node_modules/@dicebear/core/lib/Options.d.ts`), not assumed from
documentation that might describe a different version.

What TripSplit actually built instead: a small CSS `@keyframes` motion
(`.pf-avatar--anim-slow/medium/fast` in
`src/features/profile/components/avatar.css`) — a subtle continuous
scale+rotate "drift" — applied to the `<img>` of an already-generated
static DiceBear SVG, only ever on the large preview (never the picker
grid, so browsing stays calm), and only offered for the 5 curated
`animated: true` catalog styles (glass/planets/shapes/waves/loops),
which read well with gentle motion. `AnimationControl.jsx` exposes
Off/Slow/Medium/Fast; `prefers-reduced-motion: reduce` disables it
entirely (and disables the loading-skeleton shimmer too), per the
project's existing reduced-motion conventions elsewhere in the app.

The persisted `avatar_animation` value (`none|slow|medium|fast`) is real
and round-trips correctly — it's the *mechanism* (native DiceBear
animated SVG) that doesn't exist, not the feature.

## Persistence — `avatar_key` stays the one backend field

TripSplit's existing member/profile model already has a single
`avatar_key` string field, read via `avatarGlyph(member.avatar_key)`
across member lists, activity feed, funds, governance, and the guest
create/join flows (`src/shared/utils/avatars.js`). This is a
frontend-only repository with no visibility into (or ability to migrate)
the backend schema, so rather than inventing new fields
(`avatar_type`/`avatar_style`/`avatar_seed`/`avatar_animation`) that
would need a real backend migration, the whole configuration is encoded
into that one existing string — see `src/features/profile/utils/avatarKey.js`:

```
initials_<colorId>                        e.g. initials_indigo
dicebear_<style>_<seed>_<animation>        e.g. dicebear_lorelei_a1b2c3d4_slow
```

Anything that isn't one of these two forms (including every legacy
`avatar_01`..`avatar_12` value already in use, and any value this system
doesn't recognize) falls through unchanged to the original emoji-glyph
rendering — no existing guest or legacy member's avatar changes.

Seeds are generated once (`createSeed()`, `crypto.randomUUID()` with
hyphens stripped) when the user selects a candidate, not derived from
the display name — so a later display-name edit can't silently change
someone's Avatars-mode picture out from under them (Initials mode is the
opposite: intentionally *always* live-derived from the current display
name, since that's the whole point of that mode).

## Canonical `Avatar` component

`src/features/profile/components/Avatar.jsx` is the one renderer for
every `avatar_key` format. It's wired into: onboarding (via
`AvatarPreview`/`AvatarPickerGrid`), the trip Members panel, the Member
Detail dialog, and the Profile page's trip-history avatar. It was **not**
wired into the activity feed, funds, governance panels, or the expense
allocation rows in this pass — those still call the original
`avatarGlyph()` directly, which degrades gracefully (renders the generic
👤 fallback) rather than breaking for a `dicebear_*`/`initials_*` key,
but doesn't render the real generated avatar there yet. Noted as a
follow-up, not silently left inconsistent.

```jsx
<Avatar avatarKey={member.avatar_key} displayName={member.display_name} size="sm" />
```

Async DiceBear generation is handled internally
(`useDicebearAvatar` hook): a skeleton shimmer while loading, the real
`<img>` once ready, and — per the "no broken image icons" requirement —
an **initials rendering**, not a broken `<img>` or empty box, if
generation ever fails (unknown style, chunk load failure, etc.).

## Shuffle / selection semantics

The picker grid (`AvatarPickerGrid.jsx`) never invents avatars on its
own — `ProfileSetupPage.jsx` owns the candidate batch (12 items,
randomly drawn from the active category) and the actual selection
separately. Shuffle regenerates the batch only; the selected
`(style, seed)` is independent state that doesn't reset just because the
batch around it changed, and switching between Initials/Avatars mode
(or between categories) doesn't discard the other mode's prior selection
either — both are always held in state, only the visible controls change.

## Lazy loading

Loading is lazy at the *data* layer (per-style `import()` in
`avatarGenerator.js`, see "Bundle strategy" above) rather than at the
*component* layer. `React.lazy()`-wrapping `AvatarPickerGrid`/
`AnimationControl` was considered and skipped — those components are
tiny JS, and the actual weight (DiceBear core + style JSON) is already
deferred regardless of whether the wrapping component is in the initial
bundle, so a second layer of lazy-loading would have added complexity
without a measurable bundle-size benefit.
