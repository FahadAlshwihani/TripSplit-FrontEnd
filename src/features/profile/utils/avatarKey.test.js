import {
  encodeInitialsKey, encodeDicebearKey, decodeDicebearKey, decodeInitialsKey,
} from './avatarKey';

test('encodes and decodes an initials key round-trip', () => {
  const key = encodeInitialsKey('coral');
  expect(key).toBe('initials_coral');
  expect(decodeInitialsKey(key)).toBe('coral');
  expect(decodeDicebearKey(key)).toBeNull();
});

test('encodes and decodes a static (no-animation) dicebear key round-trip', () => {
  const key = encodeDicebearKey({ style: 'lorelei', seed: 'abc123' });
  expect(key).toBe('dicebear_lorelei_abc123_none');
  expect(decodeDicebearKey(key)).toEqual({ style: 'lorelei', seed: 'abc123', animation: 'none' });
  expect(decodeInitialsKey(key)).toBeNull();
});

test('encodes and decodes an animated dicebear key round-trip', () => {
  const key = encodeDicebearKey({ style: 'bottts-neutral', seed: 'xyz789', animation: 'medium' });
  expect(key).toBe('dicebear_bottts-neutral_xyz789_medium');
  expect(decodeDicebearKey(key)).toEqual({ style: 'bottts-neutral', seed: 'xyz789', animation: 'medium' });
});

test('an unsupported/unrecognized animation level is rejected and normalized to "none"', () => {
  const key = encodeDicebearKey({ style: 'glass', seed: 'seed1', animation: 'fastest' });
  expect(key).toBe('dicebear_glass_seed1_none');
  expect(decodeDicebearKey('dicebear_glass_seed1_fastest')).toEqual({ style: 'glass', seed: 'seed1', animation: 'none' });
});

test('a malformed dicebear key (wrong segment count) fails to decode', () => {
  expect(decodeDicebearKey('dicebear_glass_seed1')).toBeNull();
  expect(decodeDicebearKey('dicebear_glass_seed1_slow_extra')).toBeNull();
  expect(decodeDicebearKey('dicebear_')).toBeNull();
});

test('legacy/unrelated keys decode as neither initials nor dicebear', () => {
  expect(decodeInitialsKey('avatar_01')).toBeNull();
  expect(decodeDicebearKey('avatar_01')).toBeNull();
  expect(decodeInitialsKey(undefined)).toBeNull();
  expect(decodeDicebearKey(undefined)).toBeNull();
});
