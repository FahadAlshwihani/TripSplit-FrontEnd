import React from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import useModalDialog from '../../../shared/hooks/useModalDialog';
import SupportForm from './SupportForm';
import '../styles/support.css';

export default function SupportTicketDialog({ tripId, currentMember, onClose }) {
  const { t } = useTranslation();
  const dialogRef = useModalDialog(onClose);

  return (
    <ModalPortal>
      <div className="support-dialog-overlay" role="presentation" onClick={onClose}>
        <section
          ref={dialogRef}
          tabIndex={-1}
          className="support-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-support-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="support-dialog__header">
            <h2 id="quick-support-title" className="support-dialog__title">{t('support.directAssistance.reportProblem')}</h2>
            <button type="button" className="support-dialog__close" aria-label={t('common.close')} onClick={onClose}>
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </header>
          <div className="support-dialog__body">
            <SupportForm
              tripId={tripId}
              currentMember={currentMember}
              presetSubject="technical_problem"
              presetSignal={1}
              idPrefix="quick-support"
            />
          </div>
        </section>
      </div>
    </ModalPortal>
  );
}
