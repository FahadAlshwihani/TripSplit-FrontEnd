import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingButton from '../../../shared/components/LoadingButton';

const LeaveTripDialog = ({ tripTitle, busy, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  // Cancel gets initial focus, not the destructive confirm action -- a
  // stray Enter/Space shouldn't be able to leave the trip.
  const cancelRef = useRef(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);

  return (
    <div className="acc-dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        className="acc-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="acc-leave-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="acc-leave-dialog-title" className="text-headline-sm">{t('account.trips.leaveDialog.title', { title: tripTitle })}</h2>
        <p className="text-copy">{t('account.trips.leaveDialog.body')}</p>
        <div className="acc-dialog__actions">
          <button type="button" className="acc-btn" ref={cancelRef} onClick={onCancel} disabled={busy}>{t('common.cancel')}</button>
          <LoadingButton
            type="button"
            className="acc-btn acc-btn--danger"
            loading={busy}
            loadingLabel={t('account.trips.leaveTrip')}
            onClick={onConfirm}
          >
            {t('account.trips.leaveTrip')}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default LeaveTripDialog;
