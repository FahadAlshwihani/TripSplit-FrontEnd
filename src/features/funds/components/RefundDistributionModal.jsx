import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Money from '../../../shared/components/Money';

const METHODS = ['proportional_to_net_contributions', 'equal', 'custom'];

/*
  Distribute Fund Surplus -- matches the Stitch reference modal: available/
  method header, a per-member allocation table, a real explicit
  confirmation step (never one click that silently reduces the balance).
  Preview is a pure server-side read (apps.funds.services.refund_preview)
  -- this component never computes allocations itself, only renders what
  the server returns.
*/
const RefundDistributionModal = ({ available, currency, onPreview, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState('proportional_to_net_contributions');
  const [distributionAmount, setDistributionAmount] = useState(Number(available).toFixed(2));
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const runPreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const result = await onPreview({ method, distribution_amount: distributionAmount });
      setPreview(result);
    } catch (previewError) {
      setError(previewError);
    } finally {
      setPreviewing(false);
    }
  };

  const confirm = async () => {
    if (!preview || !acknowledged || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ method: preview.method, distribution_amount: preview.distribution_amount, refund_date: new Date().toISOString().slice(0, 10), idempotency_key: crypto.randomUUID() });
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="bal-dialog-overlay" role="presentation" onClick={onClose}>
        <div className="bal-dialog fund-refund-modal" role="dialog" aria-modal="true" aria-labelledby="fund-refund-title" onClick={(event) => event.stopPropagation()}>
          <div className="bal-dialog__head">
            <h2 id="fund-refund-title" className="bal-dialog__title text-headline">{t('fund.distributeSurplus')}</h2>
            <button type="button" className="exp-modal__close" aria-label={t('common.close')} onClick={onClose}><i className="bi bi-x-lg" aria-hidden="true" /></button>
          </div>

          <div className="bal-dialog__body">
            <div className="fund-refund-modal__header">
              <div>
                <span className="text-label">{t('fund.available')}</span>
                <Money value={available} currency={currency} className="fund-refund-modal__available" />
              </div>
              <div className="fund-refund-modal__method">
                <span className="text-label">{t('fund.refundMethod')}</span>
                <SegmentedControl ariaLabel={t('fund.refundMethod')} options={METHODS.map((value) => ({ value, label: t(`fund.refundMethods.${value}`) }))} value={method} onChange={(value) => { setMethod(value); setPreview(null); }} />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="fund-refund-amount">{t('fund.distributionAmount')}</label>
              <input id="fund-refund-amount" type="number" inputMode="decimal" min="0.01" max={available} step="0.01" className="field-control field-control--amount" value={distributionAmount} onChange={(event) => { setDistributionAmount(event.target.value); setPreview(null); }} />
            </div>

            {!preview ? (
              <button type="button" className="dash-btn dash-btn--secondary" onClick={runPreview} disabled={previewing || !(Number(distributionAmount) > 0)}>
                {previewing ? t('fund.previewing') : t('fund.preview')}
              </button>
            ) : (
              <>
                <div className="fund-refund-table">
                  <div className="fund-refund-table__head">
                    <span>{t('fund.member')}</span>
                    <span>{t('fund.refundAmountLabel')}</span>
                  </div>
                  {preview.allocations.map((row) => (
                    <div className="fund-refund-table__row" key={row.member_id}>
                      <span>{row.display_name}</span>
                      <Money value={row.refund_amount} currency={currency} variant="tabular" />
                    </div>
                  ))}
                  <div className="fund-refund-table__row fund-refund-table__row--total">
                    <span>{t('fund.total')}</span>
                    <Money value={preview.distribution_amount} currency={currency} variant="tabular" />
                  </div>
                </div>

                <label className="settle-dialog__ack">
                  <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
                  <span>{t('fund.refundAcknowledge')}</span>
                </label>
              </>
            )}

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="exp-composer__footer">
            <div className="exp-composer__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="button" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!preview || !acknowledged || submitting} onClick={confirm}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('fund.distribute')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default RefundDistributionModal;
