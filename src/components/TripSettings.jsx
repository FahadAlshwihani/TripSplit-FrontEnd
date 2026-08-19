import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TripSettings = ({ trip, permissions, onUpdate, onArchive, onRestore }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: trip.title, budget: trip.budget, currency: trip.currency, password: '' });
  if (!permissions.canEditTrip && !permissions.canArchiveTrip && !permissions.canRestoreTrip) return null;
  return <section className="card-pc"><h2>{t('trip.settings')}</h2>{permissions.canEditTrip && <form onSubmit={(e) => { e.preventDefault(); onUpdate(form); }}><label>{t('trip.name')}<input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>{t('trip.budget')}<input className="pc-input" type="number" min="0.01" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></label><label>{t('trip.currency')}<select className="pc-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{['SAR','USD','EUR','GBP','AED','QAR','KWD','BHD','OMR'].map((c) => <option key={c}>{c}</option>)}</select></label><label>{t('trip.newPassword')}<input className="pc-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="pc-btn-create">{t('common.save')}</button></form>}{permissions.canArchiveTrip && <button className="pc-btn-danger" onClick={onArchive}>{t('trip.archive')}</button>}{permissions.canRestoreTrip && <button className="pc-btn-create" onClick={onRestore}>{t('trip.restore')}</button>}</section>;
};
export default TripSettings;
