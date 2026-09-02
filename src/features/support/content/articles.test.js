import articlesEn from './articles.en';
import articlesAr from './articles.ar';
import { CATEGORY_ORDER } from './index';

const CATALOGS = { en: articlesEn, ar: articlesAr };
const PLACEHOLDER_RE = /lorem ipsum|coming soon|todo|tbd|placeholder/i;

test('both languages define exactly the four canonical categories, in the same set as CATEGORY_ORDER', () => {
  expect(Object.keys(articlesEn).sort()).toEqual([...CATEGORY_ORDER].sort());
  expect(Object.keys(articlesAr).sort()).toEqual([...CATEGORY_ORDER].sort());
});

describe.each(Object.entries(CATALOGS))('%s catalog', (language, catalog) => {
  test.each(CATEGORY_ORDER)('%s has a title, icon, intro, and multiple real sections', (category) => {
    const article = catalog[category];
    expect(article.title.length).toBeGreaterThan(0);
    expect(article.icon.length).toBeGreaterThan(0);
    expect(article.intro.length).toBeGreaterThan(20);
    expect(article.sections.length).toBeGreaterThanOrEqual(6);
  });

  test.each(CATEGORY_ORDER)('%s has no lorem-ipsum/coming-soon/placeholder text anywhere', (category) => {
    const article = catalog[category];
    const text = JSON.stringify(article);
    expect(text).not.toMatch(PLACEHOLDER_RE);
  });

  test.each(CATEGORY_ORDER)('%s: every section has a real heading and at least one real paragraph', (category) => {
    catalog[category].sections.forEach((section) => {
      expect(section.id.length).toBeGreaterThan(0);
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.paragraphs?.length).toBeGreaterThan(0);
      section.paragraphs.forEach((paragraph) => expect(paragraph.length).toBeGreaterThan(15));
    });
  });

  test.each(CATEGORY_ORDER)('%s: section ids are unique (stable anchors/TOC targets)', (category) => {
    const ids = catalog[category].sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test('English and Arabic define the exact same section ids per category (structural parity, independent wording)', () => {
  CATEGORY_ORDER.forEach((category) => {
    const enIds = articlesEn[category].sections.map((section) => section.id);
    const arIds = articlesAr[category].sections.map((section) => section.id);
    expect(arIds).toEqual(enIds);
  });
});

test('Arabic content is not a byte-for-byte reuse of the English string (never silently untranslated)', () => {
  CATEGORY_ORDER.forEach((category) => {
    expect(articlesAr[category].title).not.toBe(articlesEn[category].title);
    expect(articlesAr[category].intro).not.toBe(articlesEn[category].intro);
  });
});
