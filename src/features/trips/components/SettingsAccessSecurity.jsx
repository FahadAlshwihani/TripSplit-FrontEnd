import React from 'react';
import { useTranslation } from 'react-i18next';

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
*/
export default function SettingsAccessSecurity({ canEdit, joinPolicy, onChangeJoinPolicy, passwordProtected, password, onPasswordChange, onRequestRemovePassword }) {
  const { t } = useTranslation();
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
            <input
              id="set-password"
              className="field-control"
              type="password"
              autoComplete="new-password"
              value={password}
              placeholder="••••••••"
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          ) : (
            <p className="set-readonly-value">{passwordProtected ? t('settings.access.passwordEnabled') : t('settings.access.passwordDisabled')}</p>
          )}
          <p className="set-hint">{t('settings.access.passwordHint')}</p>
          {canEdit && passwordProtected && (
            <button type="button" className="set-remove-password" onClick={onRequestRemovePassword}>
              {t('settings.access.removePassword')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
