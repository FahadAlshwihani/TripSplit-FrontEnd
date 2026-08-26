import React from 'react';
import { useTranslation } from 'react-i18next';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';
import { toCents } from '../hooks/useExpenseComposer';

const memberName = (members, id) => members.find((member) => member.id === id)?.display_name || '';

/*
  Section 4 -- "How should it be split?" Shared-only (hidden entirely by
  the composer shell for personal expenses). Each split type gets its
  own dedicated UI rather than one generic "value" input relabeled four
  ways, per the brief. The backend remains authoritative for the final
  numbers (percentages/shares/exact amounts are re-validated server-
  side) -- the remaining/total feedback here is purely to help the user
  reach a valid state before submitting, not a second source of truth.
*/
const ExpenseComposerSplit = ({ form, setField, setSplitValue, members, baseAmount, splitAssigned, errors }) => {
  const { t } = useTranslation();
  const participants = form.participant_ids;
  const equalShare = participants.length ? baseAmount / participants.length : 0;
  const totalWeight = participants.reduce((sum, id) => sum + Number(form.splitValues[id] || 0), 0);

  return (
    <section className="exp-composer__section">
      <h3 className="exp-composer__section-title">{t('expenseComposer.sections.split')}</h3>
      <SegmentedControl
        ariaLabel={t('expenseComposer.sections.split')}
        value={form.split_type}
        onChange={(value) => setField({ split_type: value })}
        options={[
          { value: 'equal', label: t('split.equal') },
          { value: 'exact', label: t('split.exact') },
          { value: 'percentage', label: t('split.percentage') },
          { value: 'shares', label: t('split.shares') },
        ]}
      />

      {form.split_type === 'equal' && (
        <p className="exp-composer__split-summary">
          {t('expenseComposer.equalSplitSummary', { count: participants.length })}
          {' '}
          <strong><Money value={equalShare} currency="" variant="tabular" /></strong>
        </p>
      )}

      {form.split_type === 'exact' && (
        <div className="exp-composer__split-rows">
          {participants.map((id) => (
            <div className="exp-composer__split-row" key={id}>
              <span className="exp-composer__split-row-who">
                <Avatar avatarKey={avatarKeyFromAvatar(members.find((member) => member.id === id)?.avatar)} displayName={memberName(members, id)} size="sm" />
                {memberName(members, id)}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                aria-label={`${memberName(members, id)} ${t('split.exact')}`}
                className="field-control field-control--amount exp-composer__split-row-input"
                value={form.splitValues[id] || ''}
                onChange={(event) => setSplitValue(id, event.target.value)}
              />
            </div>
          ))}
          <p className={`exp-composer__totals-row${toCents(splitAssigned) === toCents(baseAmount) ? ' exp-composer__totals-row--ok' : ' exp-composer__totals-row--bad'}`}>
            <span>{t('expenseComposer.exactRemainingLabel')}</span>
            <span>{((baseAmount * 100 - toCents(splitAssigned)) / 100).toFixed(2)}</span>
          </p>
        </div>
      )}

      {form.split_type === 'percentage' && (
        <div className="exp-composer__split-rows">
          {participants.map((id) => (
            <div className="exp-composer__split-row" key={id}>
              <span className="exp-composer__split-row-who">
                <Avatar avatarKey={avatarKeyFromAvatar(members.find((member) => member.id === id)?.avatar)} displayName={memberName(members, id)} size="sm" />
                {memberName(members, id)}
              </span>
              <div className="exp-composer__split-row-percent">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  aria-label={`${memberName(members, id)} ${t('split.percentage')}`}
                  className="field-control exp-composer__split-row-input"
                  value={form.splitValues[id] || ''}
                  onChange={(event) => setSplitValue(id, event.target.value)}
                />
                <span>%</span>
              </div>
            </div>
          ))}
          <p className={`exp-composer__totals-row${splitAssigned === 100 ? ' exp-composer__totals-row--ok' : ' exp-composer__totals-row--bad'}`}>
            <span>{t('expenseComposer.percentageAssignedLabel')}</span>
            <span>{splitAssigned}%</span>
          </p>
        </div>
      )}

      {form.split_type === 'shares' && (
        <div className="exp-composer__split-rows">
          {participants.map((id) => {
            const weight = Number(form.splitValues[id] || 0);
            const amount = totalWeight ? (weight / totalWeight) * baseAmount : 0;
            return (
              <div className="exp-composer__split-row" key={id}>
                <span className="exp-composer__split-row-who">
                  <Avatar avatarKey={avatarKeyFromAvatar(members.find((member) => member.id === id)?.avatar)} displayName={memberName(members, id)} size="sm" />
                  {memberName(members, id)}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="1"
                  aria-label={`${memberName(members, id)} ${t('split.shares')}`}
                  className="field-control exp-composer__split-row-input"
                  value={form.splitValues[id] || ''}
                  onChange={(event) => setSplitValue(id, event.target.value)}
                />
                <span className="exp-composer__split-row-calculated">
                  <Money value={amount} currency="" variant="tabular" />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {errors.split && <p className="field-error" role="alert">{t(errors.split)}</p>}
    </section>
  );
};

export default ExpenseComposerSplit;
