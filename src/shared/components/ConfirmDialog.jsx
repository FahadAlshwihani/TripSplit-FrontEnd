import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from './ModalPortal';

/*
  Canonical destructive-action confirmation -- a real portaled dialog,
  never window.confirm() (which can't be styled, isn't part of the
  design system, and reads as a raw browser prompt rather than a
  TripSplit surface). Generic/reusable: any future delete/archive/leave
  flow can use this instead of building its own.
*/
const ConfirmDialog = ({ title, body, confirmLabel, cancelLabel, destructive = true, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  useEffect(() => { confirmRef.current?.focus(); }, []);

  return (
    <ModalPortal>
      <div className="confirm-dialog-overlay" role="presentation" onClick={onCancel}>
        <div ref={dialogRef} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-body" onClick={(event) => event.stopPropagation()}>
          <h2 id="confirm-dialog-title" className="confirm-dialog__title text-headline-sm">{title}</h2>
          <p id="confirm-dialog-body" className="confirm-dialog__body text-copy-sm">{body}</p>
          <div className="confirm-dialog__actions">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={onCancel}>{cancelLabel || t('common.cancel')}</button>
            <button ref={confirmRef} type="button" className={`dash-btn ${destructive ? 'dash-btn--danger' : 'dash-btn--primary'}`} onClick={onConfirm}>
              {confirmLabel || t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmDialog;
