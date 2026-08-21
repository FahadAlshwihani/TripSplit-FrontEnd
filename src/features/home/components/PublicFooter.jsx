import React from 'react';
import { useTranslation } from 'react-i18next';

const PublicFooter = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <span className="public-footer__brand text-title">{t('home.nav.brand')}</span>
        <span className="public-footer__copyright text-caption">{t('home.footer.copyright', { year })}</span>
      </div>
    </footer>
  );
};

export default PublicFooter;
