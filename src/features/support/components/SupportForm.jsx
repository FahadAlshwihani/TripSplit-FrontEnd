import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PhoneField from '../../../shared/components/PhoneField';
import SectionLoading from '../../../shared/components/SectionLoading';
import { useAuth } from '../../../auth/AuthContext';
import { createSupportTicket } from '../api/supportApi';
import { DEFAULT_COUNTRY_CALLING_CODE } from '../../../shared/data/countryCallingCodes';

const SUBJECTS = ['suggestion', 'inquiry', 'service_request', 'technical_problem', 'other'];
const emptyDraft = { subjectType: '', customSubject: '', phoneCountryCode: DEFAULT_COUNTRY_CALLING_CODE, phoneNumber: '', requesterEmail: '', message: '' };

/*
  The ONE contact form, rendered once inside the Support page's
  "Contact Us" tabpanel (see TripSupportPage) and never unmounted while
  that page is open -- switching to the Articles tab only toggles the
  `hidden` attribute on this panel's wrapper, it never removes this
  component from the tree, so whatever the requester has already typed
  survives switching tabs and back. This also means `preselectedSubject`
  can't be a one-time useState initializer any more (a component that
  only mounts once only gets one chance to read an initial prop) --
  `presetSignal` is a counter TripSupportPage bumps every time "Report
  a Problem" is clicked (never for a plain "Contact Us" click, which
  must never overwrite an in-progress draft); this effect re-applies
  `presetSubject` only when that counter changes, so repeated Report a
  Problem clicks keep working even though the form component itself
  never remounts.

  No portal, no overlay, no modal semantics, no close/back button of
  its own -- the persistent Articles/Contact Us tab nav in
  TripSupportPage is the only navigation mechanism in or out of this
  panel.

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

export default function SupportForm({ tripId, currentMember, presetSubject, presetSignal }) {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, authLoading } = useAuth();

  const [draft, setDraft] = useState(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (presetSubject) setDraft((current) => ({ ...current, subjectType: presetSubject }));
    // Only re-applies when the parent explicitly signals a fresh
    // "Report a Problem" click (presetSignal), never on every render
    // and never for a plain "Contact Us" click -- see this component's
    // own header comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetSignal]);

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createSupportTicket(tripId, {
        trip: tripId,
        requester_email: isAuthenticated ? undefined : draft.requesterEmail,
        phone_country_code: draft.phoneCountryCode,
        phone_number: draft.phoneNumber,
        subject_type: draft.subjectType,
        custom_subject: draft.subjectType === 'other' ? draft.customSubject : undefined,
        message: draft.message,
        locale: i18n.language === 'ar' ? 'ar' : 'en',
      });
      setSuccess(ticket);
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnother = () => {
    setSuccess(null);
    setError(null);
    setDraft(emptyDraft);
  };

  return (
    <div className="support-form">
      <div className="support-form__head">
        <h2 className="support-form__title">{t('support.form.title')}</h2>
        <p className="support-form__helper">{t('support.form.helper')}</p>
      </div>

      {success ? (
        <div className="support-form__body support-success">
          <span className="material-symbols-outlined support-success__icon" aria-hidden="true">check_circle</span>
          <h3 className="support-success__title">{t('support.form.successTitle')}</h3>
          <p className="support-success__reference">{t('support.form.successReferenceLabel')}: <bdi dir="ltr">{success.reference}</bdi></p>
          <button type="button" className="dash-btn dash-btn--primary" onClick={submitAnother}>{t('support.form.submitAnother')}</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="support-form__body">
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
                    value={draft.requesterEmail}
                    onChange={(event) => setField('requesterEmail', event.target.value)}
                  />
                  {fieldError(error, 'requester_email') && <p className="field-error" role="alert">{fieldError(error, 'requester_email')}</p>}
                </div>
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="support-phone">{t('support.form.phone')}</label>
              <PhoneField
                id="support-phone"
                countryCode={draft.phoneCountryCode}
                onCountryCodeChange={(value) => setField('phoneCountryCode', value)}
                number={draft.phoneNumber}
                onNumberChange={(value) => setField('phoneNumber', value)}
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
                value={draft.subjectType}
                onChange={(event) => setField('subjectType', event.target.value)}
                disabled={submitting}
              >
                <option value="" disabled>{t('support.form.subjectPlaceholder')}</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>{t(`support.subjectType.${subject}`)}</option>
                ))}
              </select>
              {fieldError(error, 'subject_type') && <p className="field-error" role="alert">{fieldError(error, 'subject_type')}</p>}
            </div>

            {draft.subjectType === 'other' && (
              <div className="field-group">
                <label className="field-label" htmlFor="support-custom-subject">{t('support.form.customSubject')}</label>
                <input
                  id="support-custom-subject"
                  className="field-control"
                  type="text"
                  required
                  maxLength={200}
                  value={draft.customSubject}
                  onChange={(event) => setField('customSubject', event.target.value)}
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
                value={draft.message}
                onChange={(event) => setField('message', event.target.value)}
                disabled={submitting}
              />
              {fieldError(error, 'message') && <p className="field-error" role="alert">{fieldError(error, 'message')}</p>}
            </div>

            {error && Object.keys(error.fields || {}).length === 0 && (
              <p className="field-error" role="alert">{t('support.form.errors.generic')}</p>
            )}
          </div>

          <div className="support-form__footer">
            <button type="submit" className="dash-btn dash-btn--primary" disabled={submitting}>
              {submitting ? t('support.form.submitting') : t('support.form.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
