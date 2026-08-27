import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';

/*
  Extracted out of FundHolderCard so it participates in FundPage's single
  discriminated `fundDialog` state instead of managing its own local
  `open` boolean -- an independent per-component modal boolean is exactly
  what let this dialog and another Fund dialog end up mounted at the same
  time. Changing the holder never rewrites any historical money, only who
  is operationally responsible going forward; the copy says so explicitly.
*/
const ChangeHolderDialog = ({ holder, activeMembers, onSave, onClose }) => {
  const { t } = useTranslation();
  const [nextHolderId, setNextHolderId] = useState(holder.id);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (nextHolderId === holder.id) { onClose(); return; }
    setSaving(true);
    try {
      await onSave(nextHolderId);
    } catch {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fund-dialog-overlay" role="presentation" onClick={() => !saving && onClose()}>
        <form className="fund-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-holder-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="fund-dialog__head">
            <h2 id="fund-holder-dialog-title" className="fund-dialog__title text-headline">{t('fund.changeHolder')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="fund-dialog__body">
            <p className="text-copy-sm fund-holder-dialog__explanation">{t('fund.changeHolderExplanation')}</p>
            <div className="field-group">
              <label className="field-label" htmlFor="fund-holder-select">{t('fund.holder')}</label>
              <select id="fund-holder-select" className="field-control" value={nextHolderId} onChange={(event) => setNextHolderId(event.target.value)}>
                {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
              </select>
            </div>
          </div>
          <div className="fund-dialog__footer">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button type="submit" className={`dash-btn dash-btn--primary${saving ? ' dash-btn--loading' : ''}`} disabled={saving}>
              {saving && <span className="dash-btn__spinner" aria-hidden="true" />}
              {t('fund.changeHolder')}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default ChangeHolderDialog;
