import React from 'react';
import { useTranslation } from 'react-i18next';
import SegmentedControl from '../../../shared/components/SegmentedControl';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';

/*
  Section 2 -- "How was it paid?" A personal expense is always paid by
  its own owner (the backend forces this -- create_expense discards any
  submitted payer/payments for scope=personal, and _fund_payment_rows()
  explicitly rejects a trip-fund payment source for a personal expense
  with fund_personal_expense_denied). So this section only shows the
  real Trip Fund/Member(s) choice for shared expenses; for personal it
  collapses to a single read-only "paid by you" row, matching the same
  context-sensitive pattern the brief asks for in Section 3.

  The fund preview is informational only -- the backend has no balance-
  sufficiency check (a fund can legitimately run into deficit, see
  accounting()'s own `deficit` field), so exceeding the available
  balance is surfaced as a warning, never a submission block.
*/
const ExpenseComposerPayment = ({ form, setField, togglePayer, setPayerAmount, members, currentMember, hasFund, fund, tripCurrency, baseAmount, remainingPaymentCents, errors }) => {
  const { t } = useTranslation();

  if (form.scope === 'personal') {
    return (
      <section className="exp-composer__section">
        <h3 className="exp-composer__section-title">{t('expenseComposer.sections.payment')}</h3>
        <div className="exp-composer__personal-owner">
          {currentMember && <Avatar avatarKey={avatarKeyFromAvatar(currentMember.avatar)} displayName={currentMember.display_name} size="sm" />}
          <span>{t('expenseComposer.paidPersonallyByYou', { name: currentMember?.display_name || '' })}</span>
        </div>
      </section>
    );
  }

  const available = fund?.accounting ? Number(fund.accounting.balance) : 0;
  const after = available - baseAmount;
  const payerCount = Object.keys(form.payments).length;

  return (
    <section className="exp-composer__section">
      <h3 className="exp-composer__section-title">{t('expenseComposer.sections.payment')}</h3>
      <SegmentedControl
        ariaLabel={t('expenseComposer.sections.payment')}
        value={form.payment_source}
        onChange={(value) => setField({ payment_source: value })}
        options={[
          { value: 'trip_fund', label: t('expenses.ledger.tripFund'), disabled: !hasFund },
          { value: 'personal', label: t('expenseComposer.memberPaid') },
        ].filter((option) => !option.disabled || form.payment_source === option.value)}
      />

      {form.payment_source === 'trip_fund' ? (
        <div className="exp-composer__fund-preview">
          <div className="exp-composer__fund-preview-row">
            <span>{t('expenseComposer.fundAvailable')}</span>
            <Money value={available} currency={tripCurrency} variant="tabular" />
          </div>
          <div className="exp-composer__fund-preview-row">
            <span>{t('expenseComposer.fundThisExpense')}</span>
            <Money value={baseAmount} currency={tripCurrency} variant="tabular" />
          </div>
          <div className="exp-composer__fund-preview-row exp-composer__fund-preview-row--total">
            <span>{t('expenseComposer.fundAfter')}</span>
            <Money value={after} currency={tripCurrency} variant="tabular" />
          </div>
          {after < 0 && <p className="exp-composer__fund-warning" role="alert">{t('expenseComposer.fundExceedsWarning')}</p>}
        </div>
      ) : (
        <div className="exp-composer__member-list">
          {members.map((member) => {
            const isPayer = member.id in form.payments;
            return (
              <div className={`exp-composer__member-row${isPayer ? ' is-selected' : ''}`} key={member.id} onClick={() => togglePayer(member.id)}>
                <input type="checkbox" className="exp-composer__checkbox" checked={isPayer} onChange={() => togglePayer(member.id)} onClick={(event) => event.stopPropagation()} />
                <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" />
                <span className="exp-composer__member-name">{member.display_name}</span>
                {isPayer && (
                  payerCount === 1 ? (
                    <span className="exp-composer__member-amount exp-composer__member-amount--solo">
                      <Money value={baseAmount} currency="" variant="tabular" />
                    </span>
                  ) : (
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      aria-label={t('expense.paidAmount', { name: member.display_name })}
                      className="field-control field-control--amount exp-composer__member-amount"
                      value={form.payments[member.id]}
                      onChange={(event) => setPayerAmount(member.id, event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  )
                )}
              </div>
            );
          })}
          <p className={`exp-composer__totals-row${remainingPaymentCents === 0 ? ' exp-composer__totals-row--ok' : ' exp-composer__totals-row--bad'}`}>
            <span>{t('expenseComposer.totalPaid')}</span>
            <span>
              {remainingPaymentCents === 0
                ? t('expenseComposer.paymentsComplete')
                : t('expense.remaining', { amount: (Math.abs(remainingPaymentCents) / 100).toFixed(2) })}
            </span>
          </p>
          {errors.payments && <p className="field-error" role="alert">{t(errors.payments)}</p>}
        </div>
      )}
    </section>
  );
};

export default ExpenseComposerPayment;
