import React from 'react';
import { useTranslation } from 'react-i18next';

/*
  Archive/Restore -- owner-only (server enforces this identically via
  require_owner on DELETE/POST .../restore/; `canArchive`/`canRestore`
  here are the same client-derived permissionsFor() flags every other
  page already reads from outlet context, not a re-guessed role check).
  Never renders a button the viewer has no capability for.
*/
export default function SettingsDangerZone({ canArchive, canRestore, archived, onArchive, onRestore, busy }) {
  const { t } = useTranslation();
  if (!canArchive && !canRestore) return null;
  return (
    <section className="set-danger-card">
      <h3 className="set-danger-card__title">{t('settings.dangerZone.title')}</h3>
      {canRestore && (
        <button type="button" className="set-danger-btn" onClick={onRestore} disabled={busy}>
          {t('trip.restore')}
        </button>
      )}
      {canArchive && !archived && (
        <button type="button" className="set-danger-btn" onClick={onArchive} disabled={busy}>
          {t('trip.archive')}
        </button>
      )}
    </section>
  );
}
