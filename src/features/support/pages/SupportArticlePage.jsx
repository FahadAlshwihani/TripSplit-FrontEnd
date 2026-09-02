import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getArticle } from '../content';
import '../styles/support.css';
import '../styles/article.css';

// Category -> the trip pages that article actually explains, so a
// reader can jump straight there instead of hunting through the nav.
const RELATED_PAGES = {
  'getting-started': [
    { to: 'members', icon: 'group', labelKey: 'dashboard.nav.members' },
    { to: 'governance', icon: 'shield', labelKey: 'dashboard.nav.governance' },
    { to: 'settings', icon: 'settings', labelKey: 'dashboard.nav.settings' },
  ],
  expenses: [{ to: 'expenses', icon: 'receipt_long', labelKey: 'dashboard.nav.expenses' }],
  fund: [{ to: 'fund', icon: 'savings', labelKey: 'dashboard.nav.fund' }],
  settlements: [
    { to: 'balances', icon: 'account_balance_wallet', labelKey: 'dashboard.nav.balances' },
    { to: 'settlements', icon: 'receipt_long', labelKey: 'dashboard.nav.settlements' },
  ],
};

/*
  One generic renderer for all four Knowledge Base categories -- the
  content itself lives in features/support/content (frontend-local,
  bilingual, not a CMS: see that folder's own header comment), this
  component only ever walks {title, icon, intro, sections} and renders
  it. No backend involved for static help content; the route is a
  plain sibling of the Support hub (/trips/:tripId/support/:category),
  matching the app's existing flat trip-route convention.
*/
export default function SupportArticlePage() {
  const { t, i18n } = useTranslation();
  const { tripId, category } = useParams();
  const navigate = useNavigate();
  const article = getArticle(category, i18n.language === 'ar' ? 'ar' : 'en');

  if (!article) {
    return (
      <div className="sup-page article-page">
        <Link to={`/trips/${tripId}/support`} className="article-back">
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          {t('support.article.backToSupport')}
        </Link>
        <p className="text-copy">{t('support.article.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="sup-page article-page">
      <button type="button" className="article-back" onClick={() => navigate(`/trips/${tripId}/support`)}>
        <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        {t('support.article.backToSupport')}
      </button>

      <header className="article-head">
        <span className="article-head__icon-tile"><span className="material-symbols-outlined" aria-hidden="true">{article.icon}</span></span>
        <div>
          <h1 className="article-head__title text-display">{article.title}</h1>
          <p className="article-head__intro text-copy">{article.intro}</p>
        </div>
      </header>

      <div className="article-layout">
        <nav className="article-toc" aria-label={t('support.article.tocLabel')}>
          <p className="article-toc__title">{t('support.article.tocLabel')}</p>
          <ol className="article-toc__list">
            {article.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="article-body">
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="article-section">
              <h2 className="article-section__heading">{section.heading}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <p key={index} className="article-section__paragraph">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="article-section__list">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
              {section.steps && (
                <ol className="article-section__steps">
                  {section.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
              {section.callout && (
                <p className={`article-callout article-callout--${section.callout.type}`}>
                  <span className="material-symbols-outlined" aria-hidden="true">{section.callout.type === 'warning' ? 'warning' : 'lightbulb'}</span>
                  {section.callout.text}
                </p>
              )}
            </section>
          ))}

          {RELATED_PAGES[category]?.length > 0 && (
            <section className="article-related">
              <h2 className="article-related__heading">{t('support.article.relatedPages')}</h2>
              <div className="article-related__links">
                {RELATED_PAGES[category].map((page) => (
                  <Link key={page.to} to={`/trips/${tripId}/${page.to}`} className="article-related__link">
                    <span className="material-symbols-outlined" aria-hidden="true">{page.icon}</span>
                    {t(page.labelKey)}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
