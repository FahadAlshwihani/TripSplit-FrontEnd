# TripSplit public search architecture

## Product and search position

TripSplit - قطتنا is an Arabic-first shared travel ledger for friends and travel groups. It supports registered and guest participants, personal and shared expenses, flexible splits, multiple recorded currencies, member balances and settlements, and a pooled Trip Fund with funding rounds. Search copy must describe those real capabilities without implying bank transfers, exchange-rate services, exports, paid plans, ratings, or guarantees the product does not provide.

Primary Arabic intent centers on natural Gulf/Saudi phrases such as تقسيم مصاريف السفر، مصاريف القروب، قطة سفر، صندوق الرحلة، حساب المصاريف بين الأصدقاء، and تسوية الحسابات. English is secondary and targets group travel expense splitter, trip expense tracker, shared trip expenses, travel group budget, and settle travel expenses. These concepts belong in useful visible copy, not keyword stuffing or a meta-keywords tag.

## Route policy

Indexable public routes:

- `/` — product explanation and primary start/join actions
- `/features` — supported expense, Fund, balance, settlement, guest, and currency capabilities
- `/pricing` — the current free product offer

Everything else is noindex: authentication and OTP states, create/join transactions, account/profile, `/about`, invitation and join-request identifiers, legacy redirects, every trip workspace route, support state, and unknown routes. Authorization remains the security boundary; robots directives are only crawler policy.

Create Trip and Join Trip are intentionally not sitemap pages today: anonymous users are routed through authentication and the pages are transaction flows rather than useful standalone crawler content. A future public “how it works” page should only be added when it provides distinct user value.

## Metadata and structured data

`src/seo/SeoHead.jsx` owns route-aware runtime metadata. `src/seo/metadata.js` owns bilingual titles, descriptions, canonical rules, robot rules, Open Graph/Twitter values, and JSON-LD. The official site name is always `TripSplit - قطتنا`.

The homepage emits `WebSite`, `WebApplication`, and `WebPage` data. Features and pricing emit `WebPage`. No Organization, ratings, reviews, pricing claims, awards, user counts, or hidden FAQ data are invented. The existing square brand image is used with a conservative `summary` Twitter card. A purpose-made 1200×630 social image is a future visual asset, not an SEO blocker.

Arabic and English currently share the same URLs and change client-side. Because there are no stable language URLs, the app deliberately does not publish fabricated hreflang links. Static crawler metadata is Arabic-first; runtime metadata follows the selected language.

## Canonical domain and build artifacts

`REACT_APP_PUBLIC_SITE_URL` is the only canonical public-origin setting. Source code must not hardcode the temporary or future domain. `REACT_APP_SEO_ALLOW_INDEXING` must equal `true` to emit indexable public shells.

After the CRA build, `scripts/generate-seo-assets.js` creates:

- `build/__seo/*.html` Arabic-first head shells for the three public routes
- `build/sitemap.xml` containing only approved public routes
- `build/robots.txt` for the selected indexing mode

Apache `.htaccess` rewrites the approved public paths to their metadata shells before the normal BrowserRouter fallback. Private, tokenized, and unknown URLs receive the base HTML, which is permanently `noindex,nofollow`, and React then applies route-specific metadata. This improves non-JavaScript social preview behavior without an SSR migration. Apache still returns an HTTP 200 shell for unknown SPA paths; React presents a branded noindex 404. A true edge/server 404 would require hosting support or prerendering and is non-blocking for the current three-page public surface.

## Temporary-domain rollout

Current temporary deployment:

```text
REACT_APP_PUBLIC_SITE_URL=https://trip.fyaa.io
REACT_APP_SEO_ALLOW_INDEXING=false
```

This builds complete canonical/sitemap infrastructure for verification while robots and page metadata remain noindex. Do not submit the temporary property for intentional indexing.

## Final-domain migration

1. Configure the final domain and HTTPS at the frontend host.
2. Set `REACT_APP_PUBLIC_SITE_URL` to the final origin.
3. Update backend allowed hosts, CORS, CSRF trusted origins, public app URL, and any API custom-domain configuration where required.
4. Rebuild and verify canonical, Open Graph, sitemap, and `.htaccess` output.
5. Set `REACT_APP_SEO_ALLOW_INDEXING=true` and rebuild.
6. Verify `robots.txt` allows crawling and advertises the final sitemap.
7. Verify `sitemap.xml` contains only `/`, `/features`, and `/pricing` on the final origin.
8. Add the final property in Google Search Console, verify ownership, and submit `/sitemap.xml`.
9. Inspect/request indexing for the three public routes.
10. Monitor Page Indexing, canonical selection, mobile usability, enhancements, and Core Web Vitals.
11. If the temporary domain was ever indexed, configure permanent 301 redirects from each old public path to the exact new path and monitor canonical migration.

Google chooses site names and sitelinks; consistent navigation, unique metadata, internal links, structured data, canonical URLs, and the sitemap improve eligibility but do not guarantee either result.
