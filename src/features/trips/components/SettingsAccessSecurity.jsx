import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CopyLinkButton from '../../../shared/components/CopyLinkButton';
import { tripUrl } from '../../../shared/utils/shareLinks';
import { buildTripShareMessage } from '../../../shared/utils/shareMessage';

const POLICIES = ['open', 'approval_required', 'invite_only'];

/*
  Access & Security -- reuses the exact same `join_policy` field
  Governance reads/writes (Trip.join_policy via the same PATCH
  /trips/{id}/ endpoint), never a duplicate boolean: a change made
  here shows up in Governance on its next fetch and vice versa.

  The password field is a real, already-live feature (hashed,
  rate-limited, enforced in join_trip() as a gate on JOINING the
  trip -- not, as the original Stitch mock's copy implied, on
  viewing balances) -- corrected here to describe its actual
  semantics. Leaving the field blank means "no change" (never clears
  an existing password); removing password protection is its own
  explicit, separately-confirmed action so a blank save can never
  silently disable it.

  The backend HASHES the trip password (django.contrib.auth.hashers.
  make_password) and never returns it after save -- there is no
  "stored" password value this page could ever show or copy. The
  visibility toggle and copy-password action below only ever operate
  on `password`, the CURRENT, in-memory, not-yet-saved draft value the
  viewer is actively typing here -- never a fake "reveal the real
  stored password" affordance. Both controls are hidden entirely once
  `password` is empty, since there is nothing to reveal or copy.

  The invite-message action is the ONE place in the app that can
  honestly include a real password in a share message, precisely
  because this is the one place a real (draft) value exists in memory
  -- Governance's own "copy invite link" and any Fund/Settlement
  share action never have a password to pass (see shareMessage.js's
  own header comment) and never fake one.
*/
export default function SettingsAccessSecurity({ canEdit, tripName, shortCode, joinPolicy, onChangeJoinPolicy, passwordProtected, password, onPasswordChange, onRequestRemovePassword }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const inviteMessage = buildTripShareMessage({
    t, tripName, url: tripUrl(shortCode), joinPolicy, password: password || undefined, linkType: 'join',
  });

  return (
    <section className="set-card" id="access">
      <div className="set-card__head">
        <h2 className="set-card__title">{t('settings.access.title')}</h2>
        <p className="set-card__subtitle">{t('settings.access.subtitle')}</p>
      </div>
      <div className="set-card__body">
        <div className="field-group">
          <span className="field-label" id="set-join-policy-label">{t('trip.joinPolicy')}</span>
          <div className="set-join-policy" role="radiogroup" aria-labelledby="set-join-policy-label">
            {POLICIES.map((policy, index) => (
              <React.Fragment key={policy}>
                <label className="set-join-policy__option">
                  <input
                    type="radio"
                    name="set-join-policy"
                    value={policy}
                    checked={joinPolicy === policy}
                    disabled={!canEdit}
                    onChange={() => onChangeJoinPolicy(policy)}
                  />
                  <span className="set-join-policy__text">
                    <span className="set-join-policy__label">{t(`joinPolicy.${policy}`)}</span>
                    <p className="set-join-policy__desc">{t(`settings.access.joinPolicyDesc.${policy}`)}</p>
                  </span>
                </label>
                {index < POLICIES.length - 1 && <div className="set-join-policy__divider" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="field-group set-divider">
          <label className="field-label" htmlFor="set-password">{t('settings.access.password')}</label>
          {canEdit ? (
            <div className="set-password-field">
              <input
                id="set-password"
                className="field-control set-password-value"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                dir="ltr"
                value={password}
                placeholder="••••••••"
                onChange={(e) => onPasswordChange(e.target.value)}
              />
              <button
                type="button"
                className="set-password-field__toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t('settings.access.hidePassword') : t('settings.access.showPassword')}
                aria-pressed={showPassword}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <p className="set-readonly-value">{passwordProtected ? t('settings.access.passwordEnabled') : t('settings.access.passwordDisabled')}</p>
          )}
          <p className="set-hint">{t('settings.access.passwordHint')}</p>

          {canEdit && (
            <div className="set-password-actions">
              {password && (
                <CopyLinkButton
                  text={password}
                  enableShare={false}
                  successMessage={t('settings.access.passwordCopied')}
                  label={t('settings.access.copyPassword')}
                  className="set-remove-password"
                />
              )}
              {passwordProtected && (
                <button type="button" className="set-remove-password" onClick={onRequestRemovePassword}>
                  {t('settings.access.removePassword')}
                </button>
              )}
            </div>
          )}

          {canEdit && (
            <div className="set-password-actions">
              <CopyLinkButton
                text={inviteMessage}
                successMessage={t('common.inviteMessageCopied')}
                label={t('settings.access.copyInviteMessage')}
                className="set-remove-password"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
