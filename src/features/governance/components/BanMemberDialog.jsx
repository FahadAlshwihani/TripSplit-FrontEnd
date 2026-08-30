import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import useModalDialog from '../../../shared/hooks/useModalDialog';

const DURATIONS = ['1h', '24h', '7d', '30d', 'permanent'];

/*
  Ban type + reason, matching the brief's requirement that a ban carry a
  real duration (governance.py's DURATIONS -- 1h/24h/7d/30d/permanent)
  and an administrative reason rather than the two blunt "24h / permanent"
  buttons this used to be. Reason is intentionally never surfaced in the
  public Activity feed (see record_activity in ban_member()) -- only
  passed to the ban API, which keeps it admin-only.
*/
const BanMemberDialog = ({ member, onBan, onClose }) => {
  const { t } = useTranslation();
  const [duration, setDuration] = useState('24h');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const dialogRef = useModalDialog(onClose, { closeDisabled: saving });

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onBan({ duration, reason });
    } catch {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="governance-dialog-overlay" role="presentation" onClick={() => !saving && onClose()}>
        <form ref={dialogRef} tabIndex={-1} className="governance-dialog" role="dialog" aria-modal="true" aria-labelledby="ban-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="governance-dialog__head">
            <h2 id="ban-dialog-title" className="text-headline">{t('governance.banTitle', { name: member.display_name })}</h2>
            <button type="button" className="dialog-close" aria-label={t('common.close')} onClick={onClose} disabled={saving}>×</button>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="ban-duration">{t('governance.banDuration')}</label>
            <select id="ban-duration" className="field-control" value={duration} onChange={(event) => setDuration(event.target.value)}>
              {DURATIONS.map((value) => <option key={value} value={value}>{t(`governance.duration${value === 'permanent' ? 'Permanent' : value}`)}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="ban-reason">{t('governance.banReason')}</label>
            <textarea id="ban-reason" className="field-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} />
          </div>
          <div className="governance-dialog__footer">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button type="submit" className={`dash-btn dash-btn--danger${saving ? ' dash-btn--loading' : ''}`} disabled={saving}>
              {saving && <span className="dash-btn__spinner" aria-hidden="true" />}
              {t('governance.confirmBanAction')}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default BanMemberDialog;
