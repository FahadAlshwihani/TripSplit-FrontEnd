import React from 'react';
import { useTranslation } from 'react-i18next';
import CopyLinkButton from '../../../shared/components/CopyLinkButton';
import './JoinCodeCard.css';

export default function JoinCodeCard({ joinCode, joinPolicy, className = '' }) {
  const { t } = useTranslation();
  if (!joinCode) return null;

  return (
    <section className={`join-code-card ${className}`.trim()} aria-labelledby="join-code-title">
      <div className="join-code-card__copy">
        <span className="material-symbols-outlined join-code-card__icon" aria-hidden="true">key</span>
        <div>
          <h2 className="join-code-card__title" id="join-code-title">{t('trip.joinCode.title')}</h2>
          <p className="join-code-card__hint">{t(joinPolicy === 'invite_only' ? 'trip.joinCode.inviteOnlyHint' : 'trip.joinCode.hint')}</p>
        </div>
      </div>
      <div className="join-code-card__value-row">
        <bdi className="join-code-card__value" dir="ltr">{joinCode}</bdi>
        <CopyLinkButton
          text={joinCode}
          enableShare={false}
          label={t('trip.joinCode.copy')}
          successMessage={t('trip.joinCode.copied')}
          className="join-code-card__button"
        />
      </div>
    </section>
  );
}
