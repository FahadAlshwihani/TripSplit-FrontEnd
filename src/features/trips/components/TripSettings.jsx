import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// No budget field here at all -- there is no independent "Trip budget"
// domain any more (see docs/architecture/fund-accounting.md, "The Trip
// Fund is the budget"). Budget/target management belongs entirely to
// the Fund page now.
export const TripSettings = ({ trip, permissions, onUpdate, onArchive, onRestore }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: trip.title, currency: trip.currency, password: '', join_policy: trip.join_policy, settlement_confirmation_mode: trip.settlement_confirmation_mode });
  if (!permissions.canEditTrip && !permissions.canArchiveTrip && !permissions.canRestoreTrip) return null;
  return <section className="card-pc"><h2>{t('trip.settings')}</h2>{permissions.canEditTrip && <form onSubmit={(e) => { e.preventDefault(); onUpdate(form); }}><label>{t('trip.name')}<input className="pc-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>{t('trip.currency')}<select className="pc-input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{['SAR','USD','EUR','GBP','AED','QAR','KWD','BHD','OMR'].map((c) => <option key={c}>{c}</option>)}</select></label><label>{t('trip.joinPolicy')}<select className="pc-input" value={form.join_policy} onChange={(e) => setForm({ ...form, join_policy: e.target.value })}>{['open','approval_required','invite_only'].map((value) => <option key={value} value={value}>{t(`joinPolicy.${value}`)}</option>)}</select></label><label>{t('trip.settlementConfirmation')}<select className="pc-input" value={form.settlement_confirmation_mode} onChange={(e) => setForm({ ...form, settlement_confirmation_mode: e.target.value })}><option value="immediate">{t('settlements.mode.immediate')}</option><option value="recipient_confirmation">{t('settlements.mode.recipient_confirmation')}</option></select></label><label>{t('trip.newPassword')}<input className="pc-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label><button className="pc-btn-create">{t('common.save')}</button></form>}{permissions.canArchiveTrip && <button className="pc-btn-danger" onClick={onArchive}>{t('trip.archive')}</button>}{permissions.canRestoreTrip && <button className="pc-btn-create" onClick={onRestore}>{t('trip.restore')}</button>}</section>;
};
export default TripSettings;
