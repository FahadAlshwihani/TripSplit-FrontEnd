import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingButton from '../../../shared/components/LoadingButton';
import ModalPortal from '../../../shared/components/ModalPortal';

const LeaveTripDialog = ({ tripTitle, busy, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  // Cancel gets initial focus, not the destructive confirm action -- a
  // stray Enter/Space shouldn't be able to leave the trip.
  const cancelRef = useRef(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Escape cancels rather than confirms -- consistent with the trip
  // more-actions popover's own Escape behavior, and safe by construction
  // since it maps to the non-destructive action.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <ModalPortal>
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
              className={`acc-btn acc-btn--danger${busy ? ' acc-btn--loading' : ''}`}
              loading={busy}
              loadingLabel={t('account.trips.leaveTrip')}
              onClick={onConfirm}
            >
              {t('account.trips.leaveTrip')}
            </LoadingButton>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default LeaveTripDialog;
