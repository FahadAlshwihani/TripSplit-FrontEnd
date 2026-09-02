import React, { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SupportForm from '../../support/components/SupportForm';
import { CATEGORY_ORDER, getArticleCatalog } from '../../support/content';
import '../../support/styles/support.css';

/*
  Ports the supplied Stitch Support Center source's page CONTENT only
  -- header, navigation, Knowledge Base -- into the app's own
  DashboardShell (never Stitch's sidebar/topbar). No fetch of its own:
  everything here is either static or already-loaded (trip/currentMember
  from TripLayout's outlet context, user identity from useAuth() inside
  SupportForm) -- there is no page-level loading state at all, matching
  every other static Settings-style page this app already has.

  ONE unified workspace, identical on desktop and mobile: the user
  never leaves this page. `activeSupportPanel` ('articles' | 'contact')
  is the single source of truth for which panel is visible -- no
  modal, no drawer, no portal, no overlay, no separate mobile
  presentation. The persistent Articles/Contact Us tab nav (left
  column on desktop, a compact pill pair at the top on mobile -- pure
  CSS responsive layout, not two different component trees) is the
  only way to switch between them.

  Both tabpanels stay mounted at all times; switching tabs only
  toggles the `hidden` attribute, it never unmounts SupportForm -- so
  a draft the requester is mid-typing survives Contact Us -> Articles
  -> Contact Us. "Report a Problem" is a secondary shortcut into the
  same Contact Us panel that additionally forces the subject to
  technical_problem (see presetSignal/presetSubject, and SupportForm's
  own header comment for why a one-time useState initializer can't do
  this once the form never remounts).
*/
export default function TripSupportPage() {
  const { t, i18n } = useTranslation();
  const { tripId, currentMember } = useOutletContext();
  const { tripId: urlTripId } = useParams();
  const [activeSupportPanel, setActiveSupportPanel] = useState('articles');
  const [presetSubject, setPresetSubject] = useState(null);
  const [presetSignal, setPresetSignal] = useState(0);

  const catalog = getArticleCatalog(i18n.language === 'ar' ? 'ar' : 'en');

  const openContact = (subject) => {
    setActiveSupportPanel('contact');
    if (subject) {
      setPresetSubject(subject);
      setPresetSignal((count) => count + 1);
    }
  };

  return (
    <div className="sup-page">
      <header className="sup-page__header">
        <h1 className="sup-page__title">{t('support.pageTitle')}</h1>
        <p className="sup-page__subtitle">{t('support.pageSubtitle')}</p>
      </header>

      <div className="sup-grid">
        <div className="sup-nav-card">
          <div className="sup-nav-tabs" role="tablist" aria-label={t('support.nav.groupLabel')}>
            <button
              type="button"
              role="tab"
              id="sup-tab-articles"
              aria-selected={activeSupportPanel === 'articles'}
              aria-controls="sup-panel-articles"
              className={`sup-nav-tab ${activeSupportPanel === 'articles' ? 'sup-nav-tab--active' : ''}`}
              onClick={() => setActiveSupportPanel('articles')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">library_books</span>
              {t('support.nav.articles')}
            </button>
            <button
              type="button"
              role="tab"
              id="sup-tab-contact"
              aria-selected={activeSupportPanel === 'contact'}
              aria-controls="sup-panel-contact"
              className={`sup-nav-tab ${activeSupportPanel === 'contact' ? 'sup-nav-tab--active' : ''}`}
              onClick={() => openContact(null)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
              {t('support.nav.contactUs')}
            </button>
          </div>
          <button type="button" className="sup-report-btn" onClick={() => openContact('technical_problem')}>
            <span className="material-symbols-outlined sup-report-btn__icon" aria-hidden="true">report_problem</span>
            {t('support.directAssistance.reportProblem')}
          </button>
        </div>

        <div className="sup-workspace">
          <div id="sup-panel-articles" role="tabpanel" aria-labelledby="sup-tab-articles" hidden={activeSupportPanel !== 'articles'} className="sup-kb-card">
            <div className="sup-kb-card__head">
              <h2 className="sup-kb-card__title">{t('support.knowledgeBase.title')}</h2>
              <span className="material-symbols-outlined sup-kb-card__icon" aria-hidden="true">library_books</span>
            </div>
            <p className="sup-kb-card__subtitle">{t('support.knowledgeBase.subtitle')}</p>
            <div className="sup-kb-grid">
              {CATEGORY_ORDER.map((category) => {
                const article = catalog[category];
                return (
                  <Link key={category} to={`/trips/${urlTripId}/support/${category}`} className="sup-kb-item">
                    <div className="sup-kb-item__head">
                      <span className="sup-kb-item__icon-tile"><span className="material-symbols-outlined" aria-hidden="true">{article.icon}</span></span>
                      <h3 className="sup-kb-item__title">{article.title}</h3>
                    </div>
                    <p className="sup-kb-item__desc">{article.intro}</p>
                    <span className="sup-kb-item__cta">
                      {t('support.categories.readArticles')}
                      <span className="material-symbols-outlined sup-kb-item__cta-arrow" aria-hidden="true">arrow_right_alt</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div id="sup-panel-contact" role="tabpanel" aria-labelledby="sup-tab-contact" hidden={activeSupportPanel !== 'contact'} className="sup-kb-card sup-kb-card--form">
            <SupportForm tripId={tripId} currentMember={currentMember} presetSubject={presetSubject} presetSignal={presetSignal} />
          </div>
        </div>
      </div>
    </div>
  );
}
