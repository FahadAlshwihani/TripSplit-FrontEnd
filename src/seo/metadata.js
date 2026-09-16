import publicRoutes from './publicRoutes.json';

export const SITE_NAME = 'TripSplit - قطتنا';
export const DEFAULT_LOCALE = 'ar';

const COPY = {
  ar: {
    home: { title: 'TripSplit - قطتنا | تقسيم مصاريف السفر مع القروب', description: 'نظّم وقسّم مصاريف السفر بين الأصدقاء، تابع من دفع ومن عليه، وأدر صندوق الرحلة وتسوية الحسابات في مكان واحد.' },
    features: { title: 'مميزات TripSplit - قطتنا | إدارة مصاريف وصندوق الرحلة', description: 'اكتشف تقسيم المصاريف المرن، دعم العملات، صندوق الرحلة، الأرصدة والتسويات لإدارة تكاليف السفر مع القروب بوضوح.' },
    pricing: { title: 'TripSplit - قطتنا مجاني | إدارة مصاريف السفر بدون اشتراك', description: 'أنشئ رحلتك ونظّم المصاريف المشتركة وصندوق الرحلة والأرصدة والتسويات مجانًا، بدون اشتراك أو بطاقة ائتمان.' },
    private: { title: 'TripSplit - قطتنا', description: 'مساحة TripSplit الخاصة لإدارة الرحلة والمصاريف والحسابات.' },
    notFound: { title: 'الصفحة غير موجودة | TripSplit - قطتنا', description: 'الصفحة التي تبحث عنها غير موجودة.' },
  },
  en: {
    home: { title: 'TripSplit - قطتنا | Split group travel expenses clearly', description: 'Plan, track, split, and settle group travel expenses, balances, and pooled trip funds with friends in one shared ledger.' },
    features: { title: 'TripSplit Features | Expenses, Trip Fund, Balances & Settlements', description: 'Explore flexible expense splits, multi-currency records, pooled trip funds, balances, and settlements for group travel.' },
    pricing: { title: 'TripSplit Is Free | Group Travel Expense Management', description: 'Create trips and manage shared expenses, pooled funds, balances, and settlements for free, with no subscription or credit card.' },
    private: { title: 'TripSplit - قطتنا', description: 'Your private TripSplit workspace for trip expenses and shared accounts.' },
    notFound: { title: 'Page not found | TripSplit - قطتنا', description: 'The page you requested could not be found.' },
  },
};

const PUBLIC_PATHS = new Map(publicRoutes.map((route) => [route.path, route.key]));
const PRIVATE_ROUTE = /^\/(?:auth|about|create-trip|join-trip|trips(?:\/|$)|trip\/|invite\/|join-request\/|profile(?:\/|$)|account(?:\/|$)|dashboard(?:\/|$)|not-found(?:\/|$))/;

export function normalizeLanguage(language) {
  return String(language || DEFAULT_LOCALE).toLowerCase().startsWith('en') ? 'en' : 'ar';
}

export function getPublicSiteUrl(raw = process.env.REACT_APP_PUBLIC_SITE_URL) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function isIndexingAllowed(raw = process.env.REACT_APP_SEO_ALLOW_INDEXING) {
  return String(raw).toLowerCase() === 'true';
}

export function canonicalUrlFor(pathname, siteUrl = getPublicSiteUrl()) {
  if (!siteUrl || !PUBLIC_PATHS.has(pathname)) return null;
  return pathname === '/' ? `${siteUrl}/` : `${siteUrl}${pathname}`;
}

function structuredDataFor({ key, title, description, canonical, siteUrl }) {
  if (!canonical || !siteUrl) return null;
  const page = { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: title, description, isPartOf: { '@id': `${siteUrl}#website` } };
  if (key !== 'home') return { '@context': 'https://schema.org', ...page };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${siteUrl}#website`, url: siteUrl, name: SITE_NAME, alternateName: ['TripSplit', 'قطتنا'], inLanguage: ['ar', 'en'] },
      { '@type': 'WebApplication', '@id': `${siteUrl}#application`, name: SITE_NAME, alternateName: ['TripSplit', 'قطتنا'], url: canonical, description, applicationCategory: 'FinanceApplication', operatingSystem: 'Web', featureList: ['Shared and personal travel expenses', 'Flexible expense splitting', 'Multi-currency expense records', 'Trip Fund and funding rounds', 'Member balances and settlements', 'Registered and guest trip members'] },
      page,
    ],
  };
}

export function resolveSeoState(pathname, language, options = {}) {
  const locale = normalizeLanguage(language);
  const key = PUBLIC_PATHS.get(pathname);
  const knownPrivate = PRIVATE_ROUTE.test(pathname);
  const notFound = options.notFound ?? (!key && (!knownPrivate || pathname === '/not-found'));
  const content = COPY[locale][notFound ? 'notFound' : (key || 'private')];
  const siteUrl = getPublicSiteUrl();
  const canonical = key && !notFound ? canonicalUrlFor(pathname, siteUrl) : null;
  const indexable = Boolean(key && canonical && isIndexingAllowed() && !notFound);
  return {
    key: key || (notFound ? 'notFound' : 'private'), locale, title: content.title, description: content.description, canonical,
    image: canonical ? `${siteUrl}/android-chrome-512x512.png` : null,
    robots: indexable ? 'index,follow' : 'noindex,nofollow', type: 'website',
    structuredData: key && !notFound ? structuredDataFor({ key, title: content.title, description: content.description, canonical, siteUrl }) : null,
  };
}

export { COPY as SEO_COPY, publicRoutes };
