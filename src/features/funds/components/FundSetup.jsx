import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/*
  Empty state before any Fund exists for this trip. The creator picks who
  holds it up front (defaults to themself) -- create_fund() requires a
  real holder_id, never a magic "creator is holder" assumption server-side.
*/
const FundSetup = ({ canManage, activeMembers, currentMember, onCreate }) => {
  const { t } = useTranslation();
  const [holderId, setHolderId] = useState(currentMember?.id || activeMembers[0]?.id || '');

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
      <button type="button" className="dash-btn dash-btn--primary" disabled={!holderId} onClick={() => onCreate(holderId)}>
        {t('fund.create')}
      </button>
    </div>
  );
};

export default FundSetup;
