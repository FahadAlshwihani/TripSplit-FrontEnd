import React from 'react';
import { useTranslation } from 'react-i18next';
import bookImage from '../../../images/book.png';

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 7V5a4 4 0 118 0v2h.5A1.5 1.5 0 0114 8.5v5A1.5 1.5 0 0112.5 15h-9A1.5 1.5 0 012 13.5v-5A1.5 1.5 0 013.5 7H4zm2 0h4V5a2 2 0 10-4 0v2z" />
  </svg>
);

// Same local asset and treatment as the desktop context panel, reused
// below the fold on mobile (where the two-column context panel is
// hidden entirely) so the page doesn't end in a large blank area below
// the guest/back actions. Rendered only via CSS (display:none above
// 768px) rather than a separate desktop/mobile component split, so
// there is exactly one of these per step, not a hidden duplicate.
const MobileEditorialImage = () => {
  const { t } = useTranslation();
  return (
    <div className="auth-mobile-visual" aria-hidden="true">
      <div className="auth-mobile-visual__inner">
        <img className="auth-mobile-visual__image" src={bookImage} alt="" />
      </div>
      <span className="auth-mobile-visual__badge text-financial">
        <LockIcon />
        {t('auth.imageBadge')}
      </span>
    </div>
  );
};

export default MobileEditorialImage;
