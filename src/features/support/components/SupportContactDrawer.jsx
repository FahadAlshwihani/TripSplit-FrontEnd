import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalPortal from '../../../shared/components/ModalPortal';
import PhoneField from '../../../shared/components/PhoneField';
import SectionLoading from '../../../shared/components/SectionLoading';
import useModalDialog from '../../../shared/hooks/useModalDialog';
import { useAuth } from '../../../auth/AuthContext';
import { createSupportTicket } from '../api/supportApi';
import { DEFAULT_COUNTRY_CALLING_CODE } from '../../../shared/data/countryCallingCodes';
import '../styles/support.css';

const SUBJECTS = ['suggestion', 'inquiry', 'service_request', 'technical_problem', 'other'];

/*
  The ONE canonical support form -- both "Contact Support" (no
  preselected subject, the requester picks) and "Report a Problem"
  (preselects technical_problem, still changeable) render this exact
  same drawer, never a second copy. Desktop/mobile are the SAME
  component: .support-drawer (own local copy of the app's one existing
  drawer recipe, exp-drawer -- see support.css's own header comment)
  is already a fixed side panel on desktop that collapses to a
  full-viewport sheet on narrow screens, so no separate "mobile modal"
  implementation was needed.

  Identity is never a free-text guess: a registered user's name/email
  are read-only, sourced from the same useAuth() context every other
  account-aware surface reads (never re-fetched here) -- the server
  independently re-derives them from the session regardless of what
  this form would send, so this is purely a courtesy display. A guest
  has no canonical email, so that field alone is editable/required for
  them; their name still comes from their real trip membership
  (currentMember), read-only.
*/
const fieldError = (error, name) => {
  const value = error?.fields?.[name];
  return Array.isArray(value) ? value[0] : value;
};

export default function SupportContactDrawer({ onClose, tripId, currentMember, preselectedSubject }) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, authLoading } = useAuth();
  const drawerRef = useModalDialog(onClose);

  const [subjectType, setSubjectType] = useState(preselectedSubject || '');
  const [customSubject, setCustomSubject] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CALLING_CODE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createSupportTicket(tripId, {
        trip: tripId,
        requester_email: isAuthenticated ? undefined : requesterEmail,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber,
        subject_type: subjectType,
        custom_subject: subjectType === 'other' ? customSubject : undefined,
        message,
        locale: i18n.language === 'ar' ? 'ar' : 'en',
      });
      setSuccess(ticket);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="support-drawer-overlay" role="presentation" onClick={onClose} />
      <div ref={drawerRef} tabIndex={-1} className="support-drawer" role="dialog" aria-modal="true" aria-labelledby="support-drawer-title">
        <div className="support-drawer__head">
          <h2 id="support-drawer-title" className="support-drawer__title text-headline">{t('support.form.title')}</h2>
          <button type="button" className="support-drawer__close" aria-label={t('common.close')} onClick={onClose}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {success ? (
          <div className="support-drawer__body support-success">
            <span className="material-symbols-outlined support-success__icon" aria-hidden="true">check_circle</span>
            <h3 className="support-success__title">{t('support.form.successTitle')}</h3>
            <p className="support-success__reference">{t('support.form.successReferenceLabel')}: <bdi dir="ltr">{success.reference}</bdi></p>
            <button type="button" className="dash-btn dash-btn--primary" onClick={onClose}>{t('support.form.close')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="support-drawer__body">
              {authLoading && <SectionLoading minHeight={72} compact />}

              {!authLoading && isAuthenticated && user && (
                <div className="support-identity">
                  <div className="support-identity__row">
                    <span className="field-label">{t('support.form.name')}</span>
                    <p className="support-identity__value">{user.display_name}</p>
                  </div>
                  <div className="support-identity__row">
                    <span className="field-label">{t('support.form.email')}</span>
                    <p className="support-identity__value"><bdi dir="ltr">{user.email}</bdi></p>
                  </div>
                </div>
              )}

              {!authLoading && !isAuthenticated && (
                <div className="support-identity">
                  <div className="support-identity__row">
                    <span className="field-label">{t('support.form.name')}</span>
                    <p className="support-identity__value">{currentMember?.display_name}</p>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="support-email">{t('support.form.email')}</label>
                    <input
                      id="support-email"
                      className="field-control"
                      type="email"
                      dir="ltr"
                      required
                      value={requesterEmail}
                      onChange={(event) => setRequesterEmail(event.target.value)}
                    />
                    {fieldError(error, 'requester_email') && <p className="field-error" role="alert">{fieldError(error, 'requester_email')}</p>}
                  </div>
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="support-phone">{t('support.form.phone')}</label>
                <PhoneField
                  id="support-phone"
                  countryCode={phoneCountryCode}
                  onCountryCodeChange={setPhoneCountryCode}
                  number={phoneNumber}
                  onNumberChange={setPhoneNumber}
                  error={fieldError(error, 'phone_number') || fieldError(error, 'phone_country_code')}
                  disabled={submitting}
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="support-subject">{t('support.form.subject')}</label>
                <select
                  id="support-subject"
                  className="field-control"
                  required
                  value={subjectType}
                  onChange={(event) => setSubjectType(event.target.value)}
                  disabled={submitting}
                >
                  <option value="" disabled>{t('support.form.subjectPlaceholder')}</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>{t(`support.subjectType.${subject}`)}</option>
                  ))}
                </select>
                {fieldError(error, 'subject_type') && <p className="field-error" role="alert">{fieldError(error, 'subject_type')}</p>}
              </div>

              {subjectType === 'other' && (
                <div className="field-group">
                  <label className="field-label" htmlFor="support-custom-subject">{t('support.form.customSubject')}</label>
                  <input
                    id="support-custom-subject"
                    className="field-control"
                    type="text"
                    required
                    maxLength={200}
                    value={customSubject}
                    onChange={(event) => setCustomSubject(event.target.value)}
                    disabled={submitting}
                  />
                  {fieldError(error, 'custom_subject') && <p className="field-error" role="alert">{fieldError(error, 'custom_subject')}</p>}
                </div>
              )}

              <div className="field-group">
                <label className="field-label" htmlFor="support-message">{t('support.form.message')}</label>
                <textarea
                  id="support-message"
                  className="field-control support-message"
                  required
                  rows={5}
                  maxLength={5000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={submitting}
                />
                {fieldError(error, 'message') && <p className="field-error" role="alert">{fieldError(error, 'message')}</p>}
              </div>

              {error && Object.keys(error.fields || {}).length === 0 && (
                <p className="field-error" role="alert">{t('support.form.errors.generic')}</p>
              )}
            </div>

            <div className="support-drawer__footer">
              <button type="button" className="dash-btn dash-btn--secondary" onClick={onClose} disabled={submitting}>{t('support.form.cancel')}</button>
              <button type="submit" className="dash-btn dash-btn--primary" disabled={submitting}>
                {submitting ? t('support.form.submitting') : t('support.form.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalPortal>
  );
}
