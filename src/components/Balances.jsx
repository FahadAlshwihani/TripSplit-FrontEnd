import React from 'react';
import { avatarGlyph } from '../utils/avatars';

const money = (value, currency) => `${value} ${currency}`;
const Balances = ({ data }) => {
  if (!data) return null;
  return <div className="card-pc balances-card"><h2>Balances / الحسابات</h2><div className="balance-members">{data.members.map((member) => <div className="balance-row" key={member.member_id}><span className="member-avatar">{avatarGlyph(member.avatar_key)}</span><div><strong>{member.display_name}</strong><p>Paid: {money(member.paid, data.currency)} · Share: {money(member.owed, data.currency)}</p><p className={Number(member.balance) >= 0 ? 'text-success' : 'text-danger'}>{Number(member.balance) > 0 ? `Gets back: ${money(member.balance, data.currency)}` : Number(member.balance) < 0 ? `Owes: ${money(String(Math.abs(Number(member.balance)).toFixed(2)), data.currency)}` : 'Settled'}</p></div></div>)}</div><h3>Suggested settlements</h3>{data.suggested_settlements.length ? <div className="settlement-list">{data.suggested_settlements.map((item) => <div className="settlement-row" key={`${item.from_member}-${item.to_member}`}><strong>{item.from_name} → {item.to_name}</strong><span>{money(item.amount, data.currency)}</span></div>)}</div> : <p>Everyone is settled.</p>}</div>;
};
export default Balances;
