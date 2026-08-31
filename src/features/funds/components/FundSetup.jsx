import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/*
  Empty state before any Fund exists for this trip -- and the ONE place
  the trip's budget/kitty goal is first established (see docs/
  architecture/fund-accounting.md, "The Trip Fund is the budget"). The
  creator picks who holds it (defaults to themself, create_fund()
  requires a real holder_id, never a magic "creator is holder"
  assumption server-side) and MAY set an initial target in the same
  step -- optional, since trip creation itself never asks for a budget,
  and a target can always be set later via update_fund_target.
*/
const FundSetup = ({ canManage, activeMembers, currentMember, onCreate }) => {
  const { t } = useTranslation();
  const [holderId, setHolderId] = useState(currentMember?.id || activeMembers[0]?.id || '');
  const [targetAmount, setTargetAmount] = useState('');

  if (!canManage) {
    return (
      <div className="bal-empty">
        <i className="bi bi-piggy-bank bal-empty__icon" aria-hidden="true" />
        <h2 className="bal-empty__title text-headline-sm">{t('fund.empty')}</h2>
      </div>
    );
  }

  return (
    <div className="fund-setup">
      <i className="bi bi-piggy-bank fund-setup__icon" aria-hidden="true" />
      <h2 className="fund-setup__title text-headline-sm">{t('fund.empty')}</h2>
      <p className="fund-setup__body text-copy">{t('fund.setupBody')}</p>
      <div className="field-group fund-setup__holder">
        <label className="field-label" htmlFor="fund-setup-holder">{t('fund.holder')}</label>
        <select id="fund-setup-holder" className="field-control" value={holderId} onChange={(event) => setHolderId(event.target.value)}>
          {activeMembers.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}
        </select>
      </div>
      <div className="field-group fund-setup__target">
        <label className="field-label" htmlFor="fund-setup-target">{t('fund.targetOptional')}</label>
        <input
          id="fund-setup-target"
          className="field-control field-control--amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
        />
        <p className="text-copy-sm">{t('fund.targetHint')}</p>
      </div>
      <button type="button" className="dash-btn dash-btn--primary" disabled={!holderId} onClick={() => onCreate(holderId, targetAmount || undefined)}>
        {t('fund.create')}
      </button>
    </div>
  );
};

export default FundSetup;
