import en from './locales/en.json';
import ar from './locales/ar.json';

test('every home.* key present in the English bundle has a non-empty Arabic translation', () => {
  const homeKeys = Object.keys(en).filter((key) => key.startsWith('home.'));
  expect(homeKeys.length).toBeGreaterThan(0);
  const missing = homeKeys.filter((key) => !ar[key] || !ar[key].trim());
  expect(missing).toEqual([]);
});

test('the Arabic bundle does not silently reuse the English string for translatable Home copy', () => {
  // Sample keys that are genuinely translatable (not proper nouns like brand/merchant names) —
  // guards against a key existing but accidentally being left as a copy-pasted English value.
  const translatableSamples = [
    'home.nav.features', 'home.nav.pricing', 'home.nav.signIn',
    'home.hero.headline', 'home.hero.descriptionDesktop', 'home.hero.createTrip', 'home.hero.joinTrip',
    'home.preview.eyebrow', 'home.preview.overviewLabel', 'home.preview.budgetLabel', 'home.preview.fundLabel', 'home.preview.expensesLabel',
  ];
  const untranslated = translatableSamples.filter((key) => en[key] === ar[key]);
  expect(untranslated).toEqual([]);
});
