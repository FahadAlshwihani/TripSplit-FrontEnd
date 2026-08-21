import React from 'react';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section className="hero" aria-labelledby="hero-headline">
      <h1 id="hero-headline" className="hero__headline text-display">{t('home.hero.headline')}</h1>
      <p className="hero__description hero__description--desktop text-body">{t('home.hero.descriptionDesktop')}</p>
      <p className="hero__description hero__description--mobile text-body">{t('home.hero.descriptionMobile')}</p>
      <div className="hero__actions">
        <a href="#create-trip" className="btn btn--primary">{t('home.hero.createTrip')}</a>
        <a href="#join-trip" className="btn btn--secondary">{t('home.hero.joinTrip')}</a>
      </div>
    </section>
  );
};

export default Hero;
