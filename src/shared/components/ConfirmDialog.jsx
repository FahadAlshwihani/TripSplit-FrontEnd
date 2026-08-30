import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from './ModalPortal';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

/*
  Canonical destructive-action confirmation -- a real portaled dialog,
  never window.confirm() (which can't be styled, isn't part of the
  design system, and reads as a raw browser prompt rather than a
  TripSplit surface). Generic/reusable: any future delete/archive/leave
  flow can use this instead of building its own.

  Deliberately does NOT delegate to the shared useModalDialog hook:
  every other dialog in the app wants its FIRST focusable element
  focused on open, but this one deliberately focuses the CONFIRM button
  (keyboard-confirmable immediately, cancel is never the accidental
  default) -- so the Escape/Tab-trap/focus-return logic is inlined here
  instead, keeping that established, deliberate focus target intact.
*/
const ConfirmDialog = ({ title, body, confirmLabel, cancelLabel, destructive = true, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      const items = dialog ? [...dialog.querySelectorAll(FOCUSABLE)] : [];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
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
