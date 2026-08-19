import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MainLayout from '../components/Layout/MainLayout';
import Loading from '../components/Loading';
import Summary from '../components/Summary';
import CustomChart from '../components/CustomChart';
import BudgetSplit from '../components/BudgetSplit';
import Balances from '../components/Balances';
import ExpenseForm from '../components/ExpenseForm';
import SettlementsPanel from '../components/SettlementsPanel';
import MembersPanel from '../components/MembersPanel';
import ActivityPanel from '../components/ActivityPanel';
import TripSettings from '../components/TripSettings';
import { addExpense, addSettlement, archiveTrip, deleteExpense, deleteSettlement, getActivity, getBalances, getCategoryBudgets, getExpenses, getMembers, getSettlements, getTrip, leaveTrip, removeMember, restoreTrip, transferOwnership, updateExpense, updateMember, updateSettlement, updateTrip } from '../utils/api';
import { permissionsFor } from '../utils/permissions';

const TripDetailsPage = () => {
  const { code: tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trip, setTrip] = useState(null), [members, setMembers] = useState([]), [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]), [balances, setBalances] = useState(null), [settlements, setSettlements] = useState([]), [activity, setActivity] = useState([]);
  const [editing, setEditing] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = useCallback(async () => {
    const [tripData, memberData, expenseData, budgetData, balanceData, settlementData, activityData] = await Promise.all([getTrip(tripId), getMembers(tripId), getExpenses(tripId), getCategoryBudgets(tripId), getBalances(tripId), getSettlements(tripId), getActivity(tripId)]);
    setTrip(tripData); setMembers(memberData.results); setExpenses(expenseData.results); setBudgets(budgetData.results); setBalances(balanceData); setSettlements(settlementData.results); setActivity(activityData.results);
  }, [tripId]);
  useEffect(() => { setLoading(true); load().catch((err) => setError(err.response?.data?.message || t('error.loadTrip'))).finally(() => setLoading(false)); }, [load, t]);
  const currentMember = trip?.current_member;
  const permissions = useMemo(() => permissionsFor(currentMember, Boolean(trip?.archived_at)), [currentMember, trip?.archived_at]);
  const refreshFinancials = async () => { const [expenseData, balanceData, settlementData, activityData] = await Promise.all([getExpenses(tripId), getBalances(tripId), getSettlements(tripId), getActivity(tripId)]); setExpenses(expenseData.results); setBalances(balanceData); setSettlements(settlementData.results); setActivity(activityData.results); };
  const guard = async (action) => { setError(''); try { await action(); } catch (err) { setError(err.response?.data?.message || t('error.action')); } };
  const saveExpense = (payload) => guard(async () => { if (editing) await updateExpense(tripId, editing.id, payload); else await addExpense(tripId, { ...payload, idempotency_key: crypto.randomUUID() }); setEditing(null); await refreshFinancials(); });
  const memberName = (id) => members.find((m) => m.id === id)?.display_name || t('activity.unknown');
  if (loading) return <Loading />;
  if (!trip) return <MainLayout><div className="error-message">{error}<button onClick={() => navigate('/')}>{t('Home')}</button></div></MainLayout>;
  return <MainLayout><main className="home-container-pc mt-5">
    <section className="card-pc trip-details-card"><h2>{trip.title}</h2><p>{t('trip.budget')}: {trip.budget} {trip.currency}</p><p>{t('trip.code')}: <strong>{trip.join_code}</strong></p><p>{t(`role.${currentMember?.role}`)}</p><button className="pc-btn-refresh" onClick={() => guard(load)}>{t('refresh.button.text')}</button></section>
    {trip.archived_at && <div className="archive-banner" role="status">{t('trip.archivedReadOnly')}</div>}
    {error && <div className="error-message" role="alert">{error}</div>}
    <section className="card-pc"><Summary budget={trip.budget} expenses={expenses} currency={trip.currency} /></section>
    <Balances data={balances} />
    <SettlementsPanel members={members} currency={trip.currency} settlements={settlements} suggestion={balances?.suggested_settlements?.[0]} currentMember={currentMember} disabled={!permissions.canRecordSettlement} onSave={(payload, settlementId) => guard(async () => { if (settlementId) await updateSettlement(tripId, settlementId, payload); else await addSettlement(tripId, payload); await refreshFinancials(); })} onDelete={(row) => guard(async () => { if (window.confirm(t('settlements.confirmDelete'))) { await deleteSettlement(tripId, row.id); await refreshFinancials(); } })} />
    <BudgetSplit categories={budgets} currency={trip.currency} />
    {permissions.canCreateExpense && <section className="card-pc"><h2>{editing ? t('expense.edit') : t('expense.addTitle')}</h2><ExpenseForm key={editing?.id || 'create'} members={members} expense={editing} onSubmit={saveExpense} onCancel={editing ? () => setEditing(null) : null} /></section>}
    <section className="card-pc"><h2>{t('expense.history')}</h2>{expenses.length ? <div className="expenses-list">{expenses.map((expense) => <article className="expense-item" key={expense.id}><div><h4>{expense.title}</h4><p>{t(`category.${expense.category}`)} · {expense.expense_date} · {t(`split.${expense.split_type}`)}</p><p>{expense.amount} {trip.currency}</p><p>{t('expense.paidBy')}: {expense.payments.map((row) => `${memberName(row.member_id)} ${row.amount}`).join(' + ')}</p><p>{t('expense.participantCount', { count: expense.shares.length })}</p>{expense.notes && <p>{expense.notes}</p>}</div>{permissions.canEditExpense(expense) && <div className="row-actions"><button onClick={() => setEditing(expense)}>{t('common.edit')}</button><button onClick={() => guard(async () => { if (window.confirm(t('expense.confirmDelete'))) { await deleteExpense(tripId, expense.id); await refreshFinancials(); } })}>{t('common.delete')}</button></div>}</article>)}</div> : <p>{t('expense.empty')}</p>}</section>
    <MembersPanel members={members} currentMember={currentMember} permissions={permissions} onRole={(member, role) => guard(async () => { await updateMember(tripId, member.id, { role }); await load(); })} onRemove={(member) => guard(async () => { if (window.confirm(t('members.confirmRemove'))) { await removeMember(tripId, member.id); await load(); } })} onTransfer={(member) => guard(async () => { if (window.confirm(t('members.confirmTransfer'))) { await transferOwnership(tripId, member.id); await load(); } })} onLeave={() => guard(async () => { if (window.confirm(t('members.confirmLeave'))) { await leaveTrip(tripId); navigate('/'); } })} />
    <TripSettings trip={trip} permissions={permissions} onUpdate={(payload) => guard(async () => { const updated = await updateTrip(tripId, payload); setTrip({ ...trip, ...updated, current_member: currentMember }); })} onArchive={() => guard(async () => { if (window.confirm(t('trip.confirmArchive'))) { await archiveTrip(tripId); setTrip({ ...trip, archived_at: new Date().toISOString() }); } })} onRestore={() => guard(async () => { const restored = await restoreTrip(tripId); setTrip({ ...trip, ...restored, current_member: currentMember }); })} />
    <ActivityPanel events={activity} />
    <section className="card-pc"><CustomChart expenses={expenses} /></section>
  </main></MainLayout>;
};
export default TripDetailsPage;
