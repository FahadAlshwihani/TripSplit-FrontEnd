import React from 'react';
import { useTranslation } from 'react-i18next';
import './neoLoading.css';

const NeoLoading = () => {
  const { t } = useTranslation();
  return (
    <div className="neo-loading" role="status" aria-live="polite">
      <div className="neo-loading__track"><div className="neo-loading__bar" /></div>
      <p className="neo-loading__label text-label">{t('common.loading')}</p>
    </div>
  );
};

export default NeoLoading;
