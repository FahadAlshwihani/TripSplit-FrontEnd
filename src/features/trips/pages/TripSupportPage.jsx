import React, { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SupportContactDrawer from '../../support/components/SupportContactDrawer';
import { CATEGORY_ORDER, getArticleCatalog } from '../../support/content';
import '../../support/styles/support.css';

/*
  Ports the supplied Stitch Support Center source's page CONTENT only
  -- header, Direct Assistance, Knowledge Base -- into the app's own
  DashboardShell (never Stitch's sidebar/topbar). No fetch of its own:
  everything here is either static or already-loaded (trip/currentMember
  from TripLayout's outlet context, user identity from useAuth() inside
  the drawer) -- there is no page-level loading state at all, matching
  every other static Settings-style page this app already has.

  Both "Contact Support" and "Report a Problem" open the exact same
  SupportContactDrawer -- never a second form -- only differing in
  which subject starts preselected.
*/
export default function TripSupportPage() {
  const { t, i18n } = useTranslation();
  const { tripId, currentMember } = useOutletContext();
  const { tripId: urlTripId } = useParams();
  const [drawer, setDrawer] = useState(null); // null | { preselectedSubject: string|null }

  const catalog = getArticleCatalog(i18n.language === 'ar' ? 'ar' : 'en');

  return (
    <div className="sup-page">
      <header className="sup-page__header">
        <h1 className="sup-page__title">{t('support.pageTitle')}</h1>
        <p className="sup-page__subtitle">{t('support.pageSubtitle')}</p>
      </header>

      <div className="sup-grid">
        <div className="sup-assist-card">
          <h2 className="sup-assist-card__title">{t('support.directAssistance.title')}</h2>
          <button type="button" className="sup-assist-btn sup-assist-btn--primary" onClick={() => setDrawer({ preselectedSubject: null })}>
            <span className="sup-assist-btn__label">
              <span className="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
              {t('support.directAssistance.contactSupport')}
            </span>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </button>
          <button type="button" className="sup-assist-btn sup-assist-btn--secondary" onClick={() => setDrawer({ preselectedSubject: 'technical_problem' })}>
            <span className="sup-assist-btn__label">
              <span className="material-symbols-outlined sup-assist-btn__icon-danger" aria-hidden="true">report_problem</span>
              {t('support.directAssistance.reportProblem')}
            </span>
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </button>
        </div>

        <div className="sup-kb-card">
          <div className="sup-kb-card__head">
            <h2 className="sup-kb-card__title">{t('support.knowledgeBase.title')}</h2>
            <span className="material-symbols-outlined sup-kb-card__icon" aria-hidden="true">library_books</span>
          </div>
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
                    <span className="material-symbols-outlined" aria-hidden="true">arrow_right_alt</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {drawer && (
        <SupportContactDrawer
          tripId={tripId}
          currentMember={currentMember}
          preselectedSubject={drawer.preselectedSubject}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
