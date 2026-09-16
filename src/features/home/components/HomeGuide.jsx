import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HomeGuide = () => {
  const { t } = useTranslation();
  return (
    <section className="home-guide" aria-labelledby="home-guide-title">
      <header className="home-guide__header">
        <p className="home-guide__eyebrow text-label">{t('home.guide.eyebrow')}</p>
        <h2 id="home-guide-title" className="text-headline-lg">{t('home.guide.title')}</h2>
        <p className="home-guide__intro text-copy-lg">{t('home.guide.intro')}</p>
      </header>
      <div className="home-guide__ledger">
        {['split', 'fund', 'settle'].map((item, index) => (
          <article className="home-guide__row" key={item}>
            <span className="home-guide__number text-financial">0{index + 1}</span>
            <div>
              <h3 className="text-title">{t(`home.guide.${item}.title`)}</h3>
              <p className="text-copy">{t(`home.guide.${item}.body`)}</p>
            </div>
          </article>
        ))}
      </div>
      <nav className="home-guide__links" aria-label={t('home.guide.linksLabel')}>
        <Link to="/features" className="btn btn--secondary">{t('home.guide.featuresLink')}</Link>
        <Link to="/pricing" className="btn btn--secondary">{t('home.guide.pricingLink')}</Link>
      </nav>
    </section>
  );
};

export default HomeGuide;
