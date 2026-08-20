import React from 'react';
import { avatarGlyph } from '../../../shared/utils/avatars';
import { useTranslation } from 'react-i18next';

const money = (value, currency) => `${value} ${currency}`;
const Balances = ({ data }) => {
  const { t } = useTranslation();
  if (!data) return null;
  return <div className="card-pc balances-card"><h2>{t('balances.title')}</h2><div className="balance-members">{data.members.map((member) => { const negative = String(member.balance).startsWith('-'); const zero = /^-?0+(\.0+)?$/.test(String(member.balance)); return <div className="balance-row" key={member.member_id}><span className="member-avatar">{avatarGlyph(member.avatar_key)}</span><div><strong>{member.display_name}</strong><p>{t('balances.paid')}: {money(member.paid, data.currency)} · {t('balances.share')}: {money(member.expense_share || member.owed, data.currency)}</p><p>{t('balances.sent')}: {money(member.settlements_sent, data.currency)} · {t('balances.received')}: {money(member.settlements_received, data.currency)}</p><p className={negative ? 'text-danger' : 'text-success'}>{zero ? t('balances.settled') : negative ? `${t('balances.owes')}: ${money(String(member.balance).slice(1), data.currency)}` : `${t('balances.getsBack')}: ${money(member.balance, data.currency)}`}</p></div></div>; })}</div><h3>{t('balances.suggestions')}</h3>{data.suggested_settlements.length ? <div className="settlement-list">{data.suggested_settlements.map((item) => <div className="settlement-row" key={`${item.from_member}-${item.to_member}`}><strong>{item.from_name} → {item.to_name}</strong><span>{money(item.amount, data.currency)}</span></div>)}</div> : <p>{t('balances.everyoneSettled')}</p>}</div>;
};
export default Balances;
