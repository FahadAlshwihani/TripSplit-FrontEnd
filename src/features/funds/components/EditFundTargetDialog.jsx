import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import useModalDialog from '../../../shared/hooks/useModalDialog';

/*
  The ONE place the trip's budget/Fund target is ever explicitly changed
  (see docs/architecture/fund-accounting.md, "The Trip Fund is the
  budget") -- participates in FundPage's single discriminated
  `fundDialog` state like every other Fund dialog. Never rewrites any
  FundingRound; the server rejects a value below what's already been
  confirmed collected (target_below_collected), surfaced here as a
  plain inline error rather than a client-side guess at the same rule.
*/
const EditFundTargetDialog = ({ currentTarget, collected, currency, onSave, onClose }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(Number(currentTarget) > 0 ? Number(currentTarget).toFixed(2) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useModalDialog(onClose, { closeDisabled: saving });

  const submit = async (event) => {
    event.preventDefault();
    if (saving || !value) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
    } catch (submitError) {
      setError(submitError);
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fund-dialog-overlay" role="presentation" onClick={() => !saving && onClose()}>
        <form ref={dialogRef} tabIndex={-1} className="fund-dialog" role="dialog" aria-modal="true" aria-labelledby="fund-target-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="fund-dialog__head">
            <h2 id="fund-target-dialog-title" className="fund-dialog__title text-headline">{t('fund.editBudget')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose} disabled={saving}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
          <div className="fund-dialog__body">
            <p className="text-copy-sm">{t('fund.targetHint')}</p>
            <div className="field-group">
              <label className="field-label" htmlFor="fund-target-amount">{t('fund.budgetTarget')}</label>
              <input
                id="fund-target-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                className="field-control field-control--amount"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
              />
            </div>
            {Number(collected) > 0 && (
              <p className="text-copy-sm">{t('fund.collected')}: {collected} {currency}</p>
            )}
            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>
          <div className="fund-dialog__footer">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button type="submit" className={`dash-btn dash-btn--primary${saving ? ' dash-btn--loading' : ''}`} disabled={saving || !value}>
              {saving && <span className="dash-btn__spinner" aria-hidden="true" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default EditFundTargetDialog;
