// Grapheme-safe slicing — Array.from (and Intl.Segmenter, where available)
// iterate by Unicode code point / grapheme cluster, not UTF-16 code unit,
// so this doesn't cut an Arabic combining mark or a surrogate-pair
// character in half the way str.slice(0, 2) can.
const firstGraphemes = (value, count) => {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const graphemes = Array.from(segmenter.segment(value), (entry) => entry.segment);
    return graphemes.slice(0, count).join('');
  }
  return Array.from(value).slice(0, count).join('');
};

// The Arabic definite article "ال" ("the") prefixes countless given names
// and surnames (e.g. "الشمري") — stripped before taking a word's initial
// so "فهد الشمري" reads as "فش" (ف + ش, the surname's real first letter),
// not "فا" (ف + ا, just the article). A word that is only "ال" itself is
// left alone rather than stripped to nothing.
const stripArabicDefiniteArticle = (word) => {
  const stripped = word.replace(/^ال/, '');
  return stripped.length > 0 ? stripped : word;
};

// first char of first word + first char of last word for 2+ words, else
// the first two graphemes of the single word. .toUpperCase() only affects
// Latin script — Arabic (and most other scripts) has no case, so this is
// a no-op there and Arabic initials come through unchanged.
export const getInitials = (displayName) => {
  const trimmed = (displayName || '').trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/).filter(Boolean).map(stripArabicDefiniteArticle);
  const raw = words.length >= 2
    ? firstGraphemes(words[0], 1) + firstGraphemes(words[words.length - 1], 1)
    : firstGraphemes(words[0], 2);
  return raw.toUpperCase();
};
