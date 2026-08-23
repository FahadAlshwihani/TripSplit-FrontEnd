import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../auth/AuthContext';
import { buildAuthUrl } from '../../../auth/safeNext';

const Hero = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const createHref = user ? '/create-trip' : buildAuthUrl('/create-trip');
  const joinHref = user ? '/trips/join' : buildAuthUrl('/trips/join');
  return (
    <section className="hero" aria-labelledby="hero-headline">
      <div className="hero__content">
        <h1 id="hero-headline" className="hero__headline text-display">{t('home.hero.headline')}</h1>
        <p className="hero__description hero__description--desktop text-copy-lg">{t('home.hero.descriptionDesktop')}</p>
        <p className="hero__description hero__description--mobile text-copy-lg">{t('home.hero.descriptionMobile')}</p>
        <div className="hero__actions">
          <Link to={createHref} className="btn btn--primary">{t('home.hero.createTrip')}</Link>
          <Link to={joinHref} className="btn btn--secondary">{t('home.hero.joinTrip')}</Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
