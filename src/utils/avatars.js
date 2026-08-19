export const AVATARS = [
  ['avatar_01', '🦊'], ['avatar_02', '🐼'], ['avatar_03', '🦁'], ['avatar_04', '🐙'],
  ['avatar_05', '🦉'], ['avatar_06', '🐯'], ['avatar_07', '🐬'], ['avatar_08', '🦜'],
  ['avatar_09', '🐨'], ['avatar_10', '🦄'], ['avatar_11', '🐧'], ['avatar_12', '🐢'],
];
export const avatarGlyph = (key) => AVATARS.find(([candidate]) => candidate === key)?.[1] || '👤';
