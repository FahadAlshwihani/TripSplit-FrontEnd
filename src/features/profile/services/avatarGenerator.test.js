import { generateAvatarDataUri, createSeed } from './avatarGenerator';

test('the same style, seed, and size always produce the identical data URI (deterministic)', async () => {
  const first = await generateAvatarDataUri({ style: 'lorelei', seed: 'Alex Smith', size: 64 });
  const second = await generateAvatarDataUri({ style: 'lorelei', seed: 'Alex Smith', size: 64 });
  expect(first).toBe(second);
  expect(first).toMatch(/^data:image\/svg\+xml/);
});

test('a different seed produces a different data URI for the same style', async () => {
  const a = await generateAvatarDataUri({ style: 'lorelei', seed: 'seed-one', size: 64 });
  const b = await generateAvatarDataUri({ style: 'lorelei', seed: 'seed-two', size: 64 });
  expect(a).not.toBe(b);
});

test('every curated catalog style resolves and generates without error', async () => {
  const styles = ['avataaars', 'lorelei', 'adventurer', 'notionists', 'croodles', 'thumbs', 'big-smile', 'bottts', 'bottts-neutral', 'pixel-art', 'pixelbot', 'glass', 'planets', 'shapes', 'waves', 'loops'];
  await Promise.all(styles.map(async (style) => {
    const dataUri = await generateAvatarDataUri({ style, seed: 'coverage-seed', size: 64 });
    expect(dataUri).toMatch(/^data:image\/svg\+xml/);
  }));
});

test('an unrecognized style id rejects rather than silently falling back', async () => {
  await expect(generateAvatarDataUri({ style: 'not-a-real-style', seed: 'x', size: 64 })).rejects.toThrow();
});

test('createSeed produces underscore-free, non-empty, distinct values', () => {
  const seeds = Array.from({ length: 20 }, () => createSeed());
  seeds.forEach((seed) => {
    expect(seed.length).toBeGreaterThan(0);
    expect(seed).not.toMatch(/_/);
  });
  expect(new Set(seeds).size).toBe(seeds.length);
});
