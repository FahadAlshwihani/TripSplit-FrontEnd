import articlesEn from './articles.en';
import articlesAr from './articles.ar';

export const CATEGORY_ORDER = ['getting-started', 'expenses', 'fund', 'settlements'];

const BY_LANGUAGE = { en: articlesEn, ar: articlesAr };

export const getArticleCatalog = (language) => BY_LANGUAGE[language] || BY_LANGUAGE.en;

export const getArticle = (category, language) => getArticleCatalog(language)[category] || null;
