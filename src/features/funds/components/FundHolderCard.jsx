import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

/*
  Pure display + trigger -- the actual "change holder" modal is
  ChangeHolderDialog, rendered by FundPage as part of its single
  discriminated fundDialog state (see FundPage.jsx's header comment for
  why: a component-local modal boolean here was exactly what let this
  dialog and another Fund dialog end up mounted simultaneously).
*/
const FundHolderCard = ({ holder, canManage, onChangeHolder }) => {
  const { t } = useTranslation();
  return (
    <div className="fund-holder-card">
      <div className="fund-holder-card__identity">
        <Avatar avatarKey={avatarKeyFromAvatar(holder.avatar)} displayName={holder.display_name} size="md" />
        <div className="fund-holder-card__text">
          <span className="fund-holder-card__label text-label">{t('fund.holder')}</span>
          <span className="fund-holder-card__name text-headline-sm">{holder.display_name}</span>
        </div>
      </div>
      {canManage && (
        <button type="button" className="dash-btn dash-btn--secondary" onClick={onChangeHolder}>
          {t('fund.changeHolder')}
        </button>
      )}
    </div>
  );
};

export default FundHolderCard;
