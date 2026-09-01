import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';
import Money from '../../../shared/components/Money';

// Floating-point balances never land on exactly 0.00 by chance the way
// a real "settled" state does -- this is a display-only epsilon, never
// used to decide anything about the actual ledger.
const ZERO_EPSILON = 0.005;

/*
  Stitch source (CURRENT BALANCES section): a floating outlined label
  overlapping the card's top border, then a plain divided list -- 40x40
  avatar, name, a one-line state ("Owes overall" / "Gets back"), amount
  on the opposite edge. Every figure comes straight from
  GET /trips/{id}/balances/ (`members[].balance`, already
  apps.expenses.balances.calculate_balances()'s own signed figure) --
  never recomputed here.

  Every active member renders, including one sitting at exactly zero
  (a real, useful fact -- "this person owes nothing and is owed
  nothing" -- distinct from not being in the list at all), UNLESS
  literally everyone is at zero, in which case a single centered
  message replaces what would otherwise be a wall of identical "settled
  up" rows saying nothing new.
*/
export default function CurrentBalancesCard({ members, currency }) {
  const { t } = useTranslation();
  const allSettled = members.every((member) => Math.abs(Number(member.balance)) <= ZERO_EPSILON);

  return (
    <section className="settle-card">
      <span className="settle-card__label">{t('settlements.currentBalances')}</span>
      <div className="settle-card__body">
        {allSettled ? (
          <div className="settle-card-empty">
            <p className="settle-card-empty__title">{t('settlements.balancesEmptyTitle')}</p>
            <p className="settle-card-empty__body">{t('settlements.balancesEmptyBody')}</p>
          </div>
        ) : (
          <div className="settle-balance-list">
            {members.map((member) => {
              const balance = Number(member.balance);
              const sign = balance < -ZERO_EPSILON ? 'negative' : balance > ZERO_EPSILON ? 'positive' : 'zero';
              const stateKey = sign === 'negative' ? 'settlements.owesOverall' : sign === 'positive' ? 'settlements.getsBack' : 'settlements.balanced';
              return (
                <div className="settle-balance-row" key={member.member_id}>
                  <div className="settle-balance-row__who">
                    <Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="md" />
                    <div className="settle-balance-row__text">
                      <span className="settle-balance-row__name">{member.display_name}</span>
                      <p className="settle-balance-row__state">{t(stateKey)}</p>
                    </div>
                  </div>
                  {sign === 'zero' ? (
                    <Money value="0" currency={currency} variant="tabular" className="settle-balance-row__amount settle-balance-row__amount--zero" />
                  ) : (
                    <Money value={member.balance} currency={currency} variant="tabular" signDisplay="exceptZero" className={`settle-balance-row__amount settle-balance-row__amount--${sign}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
