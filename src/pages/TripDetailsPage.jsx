import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import Loading from '../components/Loading';
import Summary from '../components/Summary';
import CustomChart from '../components/CustomChart';
import BudgetSplit from '../components/BudgetSplit';
import Balances from '../components/Balances';
import { addExpense, deleteExpense, getBalances, getCategoryBudgets, getExpenses, getMembers, getTrip } from '../utils/api';
import { avatarGlyph } from '../utils/avatars';

const categories = ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other'];
const TripDetailsPage = () => {
  const { code: tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', expense_date: new Date().toISOString().slice(0, 10), payer_id: '', participant_ids: [], notes: '' });

  const load = useCallback(async () => {
    const [tripData, memberData, expenseData, budgetData, balanceData] = await Promise.all([getTrip(tripId), getMembers(tripId), getExpenses(tripId), getCategoryBudgets(tripId), getBalances(tripId)]);
    setTrip(tripData); setMembers(memberData.results); setExpenses(expenseData.results); setBudgets(budgetData.results); setBalances(balanceData);
    setForm((current) => ({ ...current, payer_id: current.payer_id || memberData.results[0]?.id || '', participant_ids: current.participant_ids.length ? current.participant_ids : memberData.results.map((member) => member.id) }));
  }, [tripId]);
  useEffect(() => { setLoading(true); load().catch((err) => setError(err.response?.data?.message || 'Could not load this trip.')).finally(() => setLoading(false)); }, [load]);

  const submitExpense = async (event) => {
    event.preventDefault(); setError('');
    try {
      const created = await addExpense(tripId, { ...form, idempotency_key: crypto.randomUUID() });
      setExpenses((current) => [created, ...current]);
      setForm((current) => ({ ...current, title: '', amount: '', notes: '' }));
      const balanceData = await getBalances(tripId); setBalances(balanceData);
    } catch (err) { setError(err.response?.data?.message || 'Could not add the expense.'); }
  };
  const removeExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await deleteExpense(tripId, expenseId); setExpenses((current) => current.filter((expense) => expense.id !== expenseId)); setBalances(await getBalances(tripId)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete the expense.'); }
  };
  const refresh = async () => { setLoading(true); setError(''); try { await load(); } catch (err) { setError(err.response?.data?.message || 'Refresh failed.'); } finally { setLoading(false); } };
  const toggleParticipant = (id) => setForm((current) => ({ ...current, participant_ids: current.participant_ids.includes(id) ? current.participant_ids.filter((item) => item !== id) : [...current.participant_ids, id] }));

  if (loading) return <Loading />;
  if (!trip) return <MainLayout><div className="error-message">{error}<button onClick={() => navigate('/')}>Home</button></div></MainLayout>;
  return <MainLayout><div className="home-container-pc mt-5">
    <div className="card-pc trip-details-card"><h2>{trip.title}</h2><p>Budget: {trip.budget} {trip.currency}</p><p>Join code: <strong>{trip.join_code}</strong></p><button className="pc-btn-refresh" onClick={refresh}>Refresh</button></div>
    {error && <div className="error-message" role="alert">{error}</div>}
    <div className="card-pc"><Summary budget={trip.budget} expenses={expenses} currency={trip.currency} /></div>
    <Balances data={balances} />
    <BudgetSplit categories={budgets} currency={trip.currency} />
    <div className="card-pc"><h2>Add New Expense</h2><form onSubmit={submitExpense}>
      <input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Description" required />
      <input className="pc-input" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" required />
      <select className="pc-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
      <input className="pc-input" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
      <label>Who paid?</label><select className="pc-input" value={form.payer_id} onChange={(e) => setForm({ ...form, payer_id: e.target.value })} required>{members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}</select>
      <fieldset className="participant-picker"><legend>Who participates? · Split equally</legend>{members.map((member) => <label key={member.id} className="participant-option"><input type="checkbox" checked={form.participant_ids.includes(member.id)} onChange={() => toggleParticipant(member.id)} /><span className="member-avatar">{avatarGlyph(member.avatar_key)}</span>{member.display_name}</label>)}</fieldset>
      <textarea className="pc-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" />
      <button className="pc-btn-create" disabled={!form.participant_ids.length}>Add Expense</button>
    </form></div>
    <div className="card-pc"><h2>Expenses</h2>{expenses.length ? <div className="expenses-list">{expenses.map((expense) => <div className="expense-item" key={expense.id}><div><h4>{expense.title}</h4><p>{expense.category} · {expense.expense_date}</p><p>{expense.amount} {trip.currency}{expense.legacy_payer_name ? ` · Paid by ${expense.legacy_payer_name}` : ''}</p></div><button className="delete-btn" onClick={() => removeExpense(expense.id)}>✕</button></div>)}</div> : <p>No expenses yet.</p>}</div>
    <div className="card-pc"><CustomChart expenses={expenses} /></div>
  </div></MainLayout>;
};
export default TripDetailsPage;
