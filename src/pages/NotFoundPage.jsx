import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import PublicLayout from '../components/Layout/PublicLayout';
import '../styles/NotFoundPage.css';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <main className="not-found-page">
        <section className="not-found-card" aria-labelledby="not-found-title">
          <p className="not-found-card__code text-financial">404</p>
          <h1 id="not-found-title" className="text-display">{t('notFound.title')}</h1>
          <p className="not-found-card__body text-copy-lg">{t('notFound.body')}</p>
          <div className="not-found-card__actions">
            <Link className="btn btn--primary" to="/">{t('notFound.home')}</Link>
            <Link className="btn btn--secondary" to="/features">{t('notFound.features')}</Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
};

export default NotFoundPage;
