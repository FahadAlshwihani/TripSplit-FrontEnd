import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../profile/components/Avatar';
import { avatarKeyFromAvatar } from '../../profile/utils/avatarKey';

const MemberDetail = ({ detail, currency, onClose }) => {
  const { t } = useTranslation();
  if (!detail) return null;
  const { member, statistics } = detail;
  return <div className="member-detail" role="dialog" aria-modal="true" aria-label={t('members.details')}><div className="card-pc"><button className="dialog-close" onClick={onClose} aria-label={t('common.close')}>×</button><h2><Avatar avatarKey={avatarKeyFromAvatar(member.avatar)} displayName={member.display_name} size="sm" /> {member.display_name}</h2><p>{t(`role.${member.role}`)} · {t(`identity.${member.identity_type}`)} · {member.active ? t('members.active') : t('members.inactive')}</p><p>{t('members.joined')}: {new Date(member.joined_at).toLocaleDateString()}</p><p>{t('members.lastActivity')}: {statistics.last_activity_at ? new Date(statistics.last_activity_at).toLocaleString() : '—'}</p><dl className="statistics-grid"><div><dt>{t('balances.paid')}</dt><dd>{statistics.total_paid} {currency}</dd></div><div><dt>{t('balances.share')}</dt><dd>{statistics.total_expense_share} {currency}</dd></div><div><dt>{t('members.personalSpending')}</dt><dd>{statistics.total_personal_spending} {currency}</dd></div><div><dt>{t('balances.sent')}</dt><dd>{statistics.settlements_sent} {currency}</dd></div><div><dt>{t('balances.received')}</dt><dd>{statistics.settlements_received} {currency}</dd></div><div><dt>{t('dashboard.yourBalance')}</dt><dd>{statistics.current_balance} {currency}</dd></div><div><dt>{t('members.expenseCount')}</dt><dd>{statistics.expense_count}</dd></div></dl></div></div>;
};

export default MemberDetail;
