import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/settings.css';
import SettingsQuickJump from '../components/SettingsQuickJump';
import SettingsDangerZone from '../components/SettingsDangerZone';
import SettingsAccount from '../components/SettingsAccount';
import SettingsPreferences from '../components/SettingsPreferences';
import SettingsGeneralLedger from '../components/SettingsGeneralLedger';
import SettingsAccessSecurity from '../components/SettingsAccessSecurity';
import SettingsSettlementRules from '../components/SettingsSettlementRules';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';
import ErrorState from '../../../shared/components/ErrorState';
import { archiveTrip, restoreTrip, updateTrip } from '../api/tripsApi';

const draftFrom = (trip) => ({ title: trip.title, start_date: trip.start_date, end_date: trip.end_date, currency: trip.currency, join_policy: trip.join_policy });

/*
  Settings never fetches its own data -- `trip` is already loaded once
  by TripLayout and shared via outlet context, exactly like every
  other Part B page's static shell. There is no data-dependent loading
  state for this page at all; only individual mutations (Save, Archive,
  Restore, Remove password) carry their own local busy state.

  A form/draft model, not one PATCH per field while typing (brief item
  21): `draft` only ever changes via user input, `trip` (outlet
  context) is the last-saved server truth. Save submits only the
  fields that actually differ from `trip` -- never a field the viewer
  has no edit capability for, and never `password` unless the user
  actually typed a new one (leaving it blank means "no change", never
  "clear the existing password" -- see SettingsAccessSecurity's own
  comment on why removing it is a separate, explicitly confirmed
  action instead).
*/
export default function TripSettingsPage() {
  const { trip, setTrip, tripId, permissions } = useOutletContext();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => draftFrom(trip));
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'archive' | 'restore' | 'remove-password' | null
  const [actionBusy, setActionBusy] = useState(false);

  const saved = useMemo(() => draftFrom(trip), [trip]);
  const isDirty = password !== '' || Object.keys(draft).some((key) => draft[key] !== saved[key]);
  const archived = Boolean(trip.archived_at);

  const onChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveSuccess(false);
  };

  const validate = () => {
    const next = {};
    if (!draft.title.trim()) next.title = t('settings.errors.titleRequired');
    else if (draft.title.length > 200) next.title = t('settings.errors.titleTooLong');
    if (draft.start_date && draft.end_date && draft.end_date < draft.start_date) next.end_date = t('settings.errors.endBeforeStart');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const payload = {};
    Object.keys(draft).forEach((key) => { if (draft[key] !== saved[key]) payload[key] = draft[key]; });
    if (password !== '') payload.password = password;
    if (Object.keys(payload).length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateTrip(tripId, payload);
      setTrip(updated);
      setPassword('');
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action) => {
    setActionBusy(true);
    try {
      if (action === 'archive') { await archiveTrip(tripId); setTrip({ ...trip, archived_at: new Date().toISOString() }); }
      else if (action === 'restore') { const updated = await restoreTrip(tripId); setTrip(updated); }
      else if (action === 'remove-password') { const updated = await updateTrip(tripId, { password: '' }); setTrip(updated); }
      setConfirmAction(null);
    } catch (error) {
      setSaveError(error);
      setConfirmAction(null);
    } finally {
      setActionBusy(false);
    }
  };

  const dialogFor = () => {
    if (confirmAction === 'archive') return { title: t('settings.dangerZone.confirmArchiveTitle'), body: t('settings.dangerZone.confirmArchiveBody'), confirmLabel: t('trip.archive') };
    if (confirmAction === 'restore') return { title: t('settings.dangerZone.confirmRestoreTitle'), body: t('settings.dangerZone.confirmRestoreBody'), confirmLabel: t('trip.restore'), destructive: false };
    if (confirmAction === 'remove-password') return { title: t('settings.access.confirmRemovePasswordTitle'), body: t('settings.access.confirmRemovePasswordBody'), confirmLabel: t('settings.access.removePassword') };
    return null;
  };
  const dialog = dialogFor();

  return (
    <div className="set-page">
      <div className="set-page__header">
        <h1 className="set-page__title text-display">{t('settings.title')}</h1>
        <p className="set-page__subtitle text-copy">{t('settings.subtitle')}</p>
      </div>

      {saveError && <ErrorState message={saveError.message} onRetry={() => setSaveError(null)} />}

      <div className="set-grid">
        <div className="set-grid__left">
          <div className="set-quick-jump"><SettingsQuickJump /></div>
          <SettingsDangerZone
            canArchive={permissions.canArchiveTrip}
            canRestore={permissions.canRestoreTrip}
            archived={archived}
            busy={actionBusy}
            onArchive={() => setConfirmAction('archive')}
            onRestore={() => setConfirmAction('restore')}
          />
          <SettingsAccount />
          <SettingsPreferences />
        </div>

        <form className="set-grid__right" onSubmit={handleSave}>
          <SettingsGeneralLedger
            canEdit={permissions.canEditTrip}
            title={draft.title}
            startDate={draft.start_date}
            endDate={draft.end_date}
            currency={draft.currency}
            currencyLocked={Boolean(trip.currency_locked)}
            onChange={onChange}
            errors={errors}
          />
          <SettingsAccessSecurity
            canEdit={permissions.canEditTrip}
            tripName={trip.title}
            joinCode={trip.join_code}
            joinPolicy={draft.join_policy}
            onChangeJoinPolicy={(value) => onChange('join_policy', value)}
            passwordProtected={Boolean(trip.password_protected)}
            password={password}
            onPasswordChange={(value) => { setPassword(value); setSaveSuccess(false); }}
            onRequestRemovePassword={() => setConfirmAction('remove-password')}
          />
          <SettingsSettlementRules />

          {permissions.canEditTrip && (
            <div className="set-save-bar">
              {saveSuccess && <p className="set-save-feedback set-save-feedback--success" role="status">{t('settings.saveSuccess')}</p>}
              <button type="submit" className="dash-btn dash-btn--primary" disabled={!isDirty || saving}>
                {saving ? t('common.saving') : t('common.saveChanges')}
              </button>
            </div>
          )}
        </form>
      </div>

      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          body={dialog.body}
          confirmLabel={dialog.confirmLabel}
          destructive={dialog.destructive !== false}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => !actionBusy && setConfirmAction(null)}
        />
      )}
    </div>
  );
}
