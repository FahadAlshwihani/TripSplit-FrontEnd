const fs = require('fs');
const path = require('path');

const routes = require('../src/seo/publicRoutes.json');
const copy = {
  home: { title: 'TripSplit - قطتنا | قسم مصاريف السفر بسهولة مع قروبك', description: 'TripSplit - قطتنا يساعدك على تنظيم وتقسيم مصاريف السفر بين الأصدقاء والقروبات، متابعة من دفع ومين عليه، إدارة صندوق الرحلة وتسوية الحسابات في مكان واحد.' },
  features: { title: 'مميزات TripSplit - قطتنا | إدارة مصاريف وصندوق الرحلة', description: 'اكتشف تقسيم المصاريف المرن، دعم العملات، صندوق الرحلة، الأرصدة والتسويات لإدارة تكاليف السفر مع القروب بوضوح.' },
  pricing: { title: 'TripSplit - قطتنا مجاني | إدارة مصاريف السفر بدون اشتراك', description: 'أنشئ رحلتك ونظّم المصاريف المشتركة وصندوق الرحلة والأرصدة والتسويات مجانًا، بدون اشتراك أو بطاقة ائتمان.' },
};

function loadLocalEnv(root) {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim();
  });
}

function publicOrigin(raw) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('REACT_APP_PUBLIC_SITE_URL must be an absolute public origin');
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname) && process.env.REACT_APP_SEO_ALLOW_INDEXING === 'true') throw new Error('Indexing cannot be enabled for a loopback origin');
  return url.origin + url.pathname.replace(/\/+$/, '');
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
}

function replaceTag(html, expression, replacement) {
  return html.replace(expression, replacement);
}

function structuredData(route, item, canonical, origin) {
  const page = { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: item.title, description: item.description, isPartOf: { '@id': `${origin}#website` } };
  if (route.key !== 'home') return { '@context': 'https://schema.org', ...page };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${origin}#website`, url: origin, name: 'TripSplit - قطتنا', alternateName: ['TripSplit', 'قطتنا'], inLanguage: ['ar', 'en'] },
      { '@type': 'WebApplication', '@id': `${origin}#application`, name: 'TripSplit - قطتنا', alternateName: ['TripSplit', 'قطتنا'], url: canonical, description: item.description, applicationCategory: 'FinanceApplication', operatingSystem: 'Web' },
      page,
    ],
  };
}

function renderShell(base, route, origin, allowIndexing) {
  const item = copy[route.key];
  const canonical = route.path === '/' ? `${origin}/` : `${origin}${route.path}`;
  const robots = allowIndexing ? 'index,follow' : 'noindex,nofollow';
  let html = base;
  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${item.title}</title>`);
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${item.description}" />`);
  html = replaceTag(html, /<meta name="robots" content="[^"]*"\s*\/>/, `<meta name="robots" content="${robots}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${item.title}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${item.description}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${item.title}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${item.description}" />`);
  const data = structuredData(route, item, canonical, origin);
  return html.replace('</head>', `    <link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n    <meta property="og:image" content="${origin}/OG.png" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="TripSplit - قطتنا group travel expense ledger" />\n    <meta name="twitter:image" content="${origin}/OG.png" />\n    <meta name="twitter:image:alt" content="TripSplit - قطتنا group travel expense ledger" />\n    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n  </head>`);
}

function generate({ root = path.resolve(__dirname, '..'), output = path.resolve(root, 'build') } = {}) {
  loadLocalEnv(root);
  if (!process.env.REACT_APP_PUBLIC_SITE_URL) throw new Error('REACT_APP_PUBLIC_SITE_URL is required to generate SEO artifacts');
  const origin = publicOrigin(process.env.REACT_APP_PUBLIC_SITE_URL);
  const allowIndexing = String(process.env.REACT_APP_SEO_ALLOW_INDEXING).toLowerCase() === 'true';
  const basePath = path.join(output, 'index.html');
  if (!fs.existsSync(basePath)) throw new Error(`Build index not found: ${basePath}`);
  const base = fs.readFileSync(basePath, 'utf8');
  const seoDir = path.join(output, '__seo');
  fs.mkdirSync(seoDir, { recursive: true });
  routes.forEach((route) => fs.writeFileSync(path.join(seoDir, `${route.key}.html`), renderShell(base, route, origin, allowIndexing)));
  const urls = routes.map((route) => `<url><loc>${escapeXml(route.path === '/' ? `${origin}/` : `${origin}${route.path}`)}</loc></url>`).join('');
  fs.writeFileSync(path.join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`);
  const robots = allowIndexing ? `User-agent: *\nAllow: /\nDisallow: /__seo/\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n';
  fs.writeFileSync(path.join(output, 'robots.txt'), robots);
}

if (require.main === module) generate();
module.exports = { generate, publicOrigin, renderShell };
