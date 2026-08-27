import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

/*
  Current Fund holder + a real, explained holder-change flow -- never a
  bare <select> that silently fires on change (the old implementation).
  Changing the holder never rewrites any historical money, only who's
  operationally responsible for receiving/confirming contributions going
  forward; the modal says so explicitly (brief section 17).
*/
const FundHolderCard = ({ holder, activeMembers, canManage, onChangeHolder }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [nextHolderId, setNextHolderId] = useState(holder.id);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (nextHolderId === holder.id) { setOpen(false); return; }
    setSaving(true);
    try {
      await onChangeHolder(nextHolderId);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

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
        <button type="button" className="dash-btn dash-btn--secondary" onClick={() => { setNextHolderId(holder.id); setOpen(true); }}>
          {t('fund.changeHolder')}
        </button>
      )}

      {open && (
        <ModalPortal>
          <div className="bal-dialog-overlay" role="presentation" onClick={() => !saving && setOpen(false)}>
            <div className="bal-dialog fund-holder-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-holder-dialog-title" onClick={(event) => event.stopPropagation()}>
              <div className="bal-dialog__head">
                <h2 id="fund-holder-dialog-title" className="bal-dialog__title text-headline">{t('fund.changeHolder')}</h2>
                <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={() => setOpen(false)}>
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>
              <div className="bal-dialog__body">
                <p className="text-copy-sm fund-holder-dialog__explanation">{t('fund.changeHolderExplanation')}</p>
                <div className="field-group">
                  <label className="field-label" htmlFor="fund-holder-select">{t('fund.holder')}</label>
                  <select id="fund-holder-select" className="field-control" value={nextHolderId} onChange={(event) => setNextHolderId(event.target.value)}>
                    {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="exp-composer__footer">
                <div className="exp-composer__footer-actions">
                  <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setOpen(false)} disabled={saving}>{t('common.cancel')}</button>
                  <button type="button" className="dash-btn dash-btn--primary" onClick={submit} disabled={saving}>{t('common.save')}</button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default FundHolderCard;
