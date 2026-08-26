import React from 'react';
import { useTranslation } from 'react-i18next';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

/*
  Section 3 -- "Who is this expense for?" Shared shows every active
  member as a selectable checkbox (a genuine subset is allowed -- this
  is not required to be all members), Personal collapses to a single
  read-only owner display rather than four checkboxes with only one
  ever meaningfully selectable, per the brief's explicit
  context-sensitive-UX instruction.
*/
const ExpenseComposerParticipants = ({ form, setScope, toggleParticipant, selectAllParticipants, clearParticipants, members, currentMember, errors }) => {
  const { t } = useTranslation();

  return (
    <section className="exp-composer__section">
      <h3 className="exp-composer__section-title"><i className="bi bi-people exp-composer__section-icon" aria-hidden="true" />{t('expenseComposer.sections.participants')}</h3>
      <SegmentedControl
        ariaLabel={t('expenseComposer.sections.participants')}
        value={form.scope}
        onChange={setScope}
        options={[
          { value: 'shared', label: t('expense.scope.shared') },
          { value: 'personal', label: t('expense.scope.personal') },
        ]}
      />

      {form.scope === 'personal' ? (
        <div className="exp-composer__personal-owner">
          {currentMember && <Avatar avatarKey={avatarKeyFromAvatar(currentMember.avatar)} displayName={currentMember.display_name} size="sm" />}
          <span>{t('expenseComposer.personalOwner', { name: currentMember?.display_name || '' })}</span>
        </div>
      ) : (
        <>
          <div className="exp-composer__select-all">
            <span className="exp-composer__select-all-label">{t('expenseComposer.allMembers')}</span>
            <label className="exp-composer__check-label">
              <input
                type="checkbox"
                className="exp-composer__checkbox"
                checked={form.participant_ids.length === members.length && members.length > 0}
                onChange={(event) => (event.target.checked ? selectAllParticipants() : clearParticipants())}
              />
              {t('common.selectAll')}
            </label>
          </div>
          <div className="exp-composer__member-list">
            {members.map((member) => {
              const isSelected = form.participant_ids.includes(member.id);
              return (
                <div className={`exp-composer__member-row${isSelected ? ' is-selected' : ''}`} key={member.id} onClick={() => toggleParticipant(member.id)}>
                  <input type="checkbox" className="exp-composer__checkbox" checked={isSelected} onChange={() => toggleParticipant(member.id)} onClick={(event) => event.stopPropagation()} />
                  <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
                  <span className="exp-composer__member-name">{member.display_name}</span>
                </div>
              );
            })}
          </div>
          {errors.participants && <p className="field-error" role="alert">{t(errors.participants)}</p>}
        </>
      )}
    </section>
  );
};

export default ExpenseComposerParticipants;
