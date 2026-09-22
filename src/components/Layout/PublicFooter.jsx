import React from 'react';
import { useTranslation } from 'react-i18next';

const FOOTER_URLS = {
  portfolio: 'https://fyaa.io/',
  linkedin: 'https://www.linkedin.com/in/fahad-alshwihani/',
  github: 'https://github.com/FahadAlshwihani',
};

const PublicFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <span className="public-footer__brand text-title" dir="ltr">{t('home.footer.brand')}</span>
        <p className="public-footer__powered text-copy-sm" dir="ltr">
          Powered by <a href={FOOTER_URLS.portfolio}>fyaa.io</a>
        </p>
        <div className="public-footer__social">
          <a href={FOOTER_URLS.linkedin} target="_blank" rel="noreferrer noopener">LinkedIn</a>
          <a href={FOOTER_URLS.github} target="_blank" rel="noreferrer noopener">GitHub</a>
        </div>
        <p className="public-footer__copyright text-caption" dir="ltr">{t('home.footer.copyright')}</p>
      </div>
    </footer>
  );
};

export default PublicFooter;
