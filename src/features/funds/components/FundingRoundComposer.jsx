import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Money from '../../../shared/components/Money';
import useModalDialog from '../../../shared/hooks/useModalDialog';

const METHODS = ['equal', 'custom', 'percentage', 'shares'];

/*
  Create Funding Round -- also reused, unchanged, as the "create a top-up
  round" flow (a top-up is never a distinct accounting transaction, just
  an ordinary round pre-filled from the deficit -- see `prefill`).
  Four split methods: equal (server-computed), custom/percentage/shares
  (a value per selected participant, live-validated client-side before
  submit -- the server independently re-validates the exact same totals
  regardless, see apps.funds.services.create_round).
*/
const FundingRoundComposer = ({ members, currency, prefill, onSubmit, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(prefill?.title || '');
  const [reason, setReason] = useState(prefill?.reason || '');
  const [targetAmount, setTargetAmount] = useState(prefill?.target_amount ? Number(prefill.target_amount).toFixed(2) : '');
  const [method, setMethod] = useState('equal');
  const [participantIds, setParticipantIds] = useState(members.map((member) => member.id));
  const [values, setValues] = useState({}); // member_id -> string, meaning depends on `method`
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useModalDialog(onClose, { closeDisabled: submitting });

  const target = Number(targetAmount) || 0;
  const toggleParticipant = (memberId) => {
    setParticipantIds((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
  };

  const selectedMembers = members.filter((member) => participantIds.includes(member.id));
  const perMemberEqual = selectedMembers.length > 0 ? (target / selectedMembers.length) : 0;
  const valueSum = selectedMembers.reduce((sum, member) => sum + (Number(values[member.id]) || 0), 0);
  const percentageValid = method !== 'percentage' || Math.abs(valueSum - 100) < 0.005;
  const customValid = method !== 'custom' || Math.abs(valueSum - target) < 0.005;
  const sharesValid = method !== 'shares' || (selectedMembers.length > 0 && selectedMembers.every((member) => Number(values[member.id]) > 0));

  const isValid = title.trim() && target > 0 && selectedMembers.length > 0 && percentageValid && customValid && sharesValid;

  const submit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = { title: title.trim(), reason: reason.trim(), target_amount: targetAmount, contribution_method: method, participant_ids: participantIds };
      if (method === 'custom') payload.custom_expectations = selectedMembers.map((member) => ({ member_id: member.id, amount: values[member.id] || '0' }));
      if (method === 'percentage') payload.custom_expectations = selectedMembers.map((member) => ({ member_id: member.id, percentage: values[member.id] || '0' }));
      if (method === 'shares') payload.custom_expectations = selectedMembers.map((member) => ({ member_id: member.id, weight: values[member.id] || '0' }));
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError);
      setSubmitting(false);
    }
  };

  const valueLabel = method === 'custom' ? t('fund.amount') : method === 'percentage' ? t('fund.percentage') : t('fund.shareWeight');

  return (
    <ModalPortal>
      <div className="fund-dialog-overlay" role="presentation" onClick={() => !submitting && onClose()}>
        <form ref={dialogRef} tabIndex={-1} className="fund-dialog fund-round-composer" role="dialog" aria-modal="true" aria-labelledby="fund-round-composer-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
          <div className="fund-dialog__head">
            <h2 id="fund-round-composer-title" className="fund-dialog__title text-headline">{t('fund.newRound')}</h2>
            <button type="button" className="fund-dialog__close" aria-label={t('common.close')} onClick={onClose} disabled={submitting}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="fund-dialog__body">
            <div className="exp-composer__grid exp-composer__grid--2">
              <div className="field-group">
                <label className="field-label" htmlFor="fund-round-title">{t('fund.roundTitle')}</label>
                <input id="fund-round-title" className="field-control" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="fund-round-target">{t('fund.target')}</label>
                <input id="fund-round-target" type="number" inputMode="decimal" min="0.01" step="0.01" className="field-control field-control--amount" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} required />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="fund-round-reason">{t('fund.reason')}</label>
              <textarea id="fund-round-reason" className="field-control fund-round-composer__reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>

            <div className="fund-round-composer__split">
              <div className="fund-round-composer__participants">
                <div className="fund-round-composer__section-head">
                  <span className="field-label">{t('expense.participants')}</span>
                  <span className="text-copy-sm">{t('fund.selectedCount', { count: selectedMembers.length })}</span>
                </div>
                <div className="fund-round-composer__participant-list">
                  {members.map((member) => {
                    const checked = participantIds.includes(member.id);
                    return (
                      <label key={member.id} className="fund-round-composer__participant">
                        <span>{member.display_name}</span>
                        <input type="checkbox" checked={checked} onChange={() => toggleParticipant(member.id)} />
                        {method !== 'equal' && checked && (
                          <input
                            type="number" inputMode="decimal" min="0" step="0.01" className="field-control fund-round-composer__participant-value"
                            aria-label={`${member.display_name} ${valueLabel}`}
                            value={values[member.id] || ''}
                            onChange={(event) => setValues((current) => ({ ...current, [member.id]: event.target.value }))}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="fund-round-composer__method">
                <span className="field-label">{t('fund.method')}</span>
                <SegmentedControl
                  ariaLabel={t('fund.method')}
                  options={METHODS.map((value) => ({ value, label: t(`fund.methodOptions.${value}`) }))}
                  value={method}
                  onChange={setMethod}
                />

                {method === 'equal' ? (
                  <div className="fund-round-composer__preview">
                    <span className="text-label">{t('fund.calculatedShare')}</span>
                    <Money value={selectedMembers.length ? perMemberEqual : 0} currency={currency} className="fund-round-composer__preview-value" />
                    <span className="text-copy-sm">{t('fund.perSelectedMember')}</span>
                  </div>
                ) : (
                  <div className="fund-round-composer__preview fund-round-composer__preview--totals">
                    <span className="text-copy-sm">
                      {method === 'percentage'
                        ? t('fund.allocatedPercentage', { value: valueSum.toFixed(2) })
                        : method === 'shares'
                          ? t('fund.totalShares', { value: valueSum.toFixed(2) })
                          : t('fund.allocatedOfTarget', { allocated: valueSum.toFixed(2), target: target.toFixed(2), currency })}
                    </span>
                    {!percentageValid && <p className="field-error" role="alert">{t('fund.errors.percentageMustBe100')}</p>}
                    {!customValid && <p className="field-error" role="alert">{t('fund.errors.customMustMatchTarget')}</p>}
                    {!sharesValid && <p className="field-error" role="alert">{t('fund.errors.sharesMustBePositive')}</p>}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="field-error" role="alert">{error.message || t('error.action')}</p>}
          </div>

          <div className="fund-dialog__footer">
            <div className="fund-dialog__footer-actions">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
              <button type="submit" className={`dash-btn dash-btn--primary${submitting ? ' dash-btn--loading' : ''}`} disabled={!isValid || submitting}>
                {submitting && <span className="dash-btn__spinner" aria-hidden="true" />}
                {t('fund.createRound')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};

export default FundingRoundComposer;
