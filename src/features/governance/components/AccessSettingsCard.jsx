import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../../shared/components/ConfirmDialog';

/*
  Wires the two governance toggles the brief kept flagging as backend-
  ready-but-unwired: Require Approval and Invite Link Active. Both map
  onto Trip.join_policy's single three-way enum (open / approval_required
  / invite_only) via PATCH /trips/{id}/ (already gated server-side by
  require_admin, same as every other governance mutation on this page --
  intentionally NOT re-narrowed to owner-only here, since that would be
  a real behavior change beyond this task's scope, not just a UI wiring
  gap; see the final report). Link OFF (invite_only) always wins over
  Require Approval, since there is no invite link left to require
  approval for -- the toggle is disabled, not merely unchecked, whenever
  the link itself is off.
*/
const AccessSettingsCard = ({ trip, onUpdateSettings, onRotateLink }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const inviteLinkActive = trip.join_policy !== 'invite_only';
  const requireApproval = trip.join_policy === 'approval_required';
  const inviteLink = `${window.location.origin}/trips/join?code=${trip.join_code}`;

  const setPolicy = async (join_policy) => {
    setBusy(true);
    try {
      await onUpdateSettings({ join_policy });
    } finally {
      setBusy(false);
    }
  };

  const toggleLinkActive = () => setPolicy(inviteLinkActive ? 'invite_only' : (requireApproval ? 'approval_required' : 'open'));
  const toggleRequireApproval = () => setPolicy(requireApproval ? 'open' : 'approval_required');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission can be denied -- the link is still visible
      // in the read-only field below for a manual copy.
    }
  };

  const confirmRotate = async () => {
    setBusy(true);
    try {
      await onRotateLink();
      setRotateConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="governance-settings card-pc">
      <h3>{t('governance.accessSettings')}</h3>

      <div className="governance-settings__row">
        <div>
          <span className="governance-settings__label">{t('governance.requireApproval')}</span>
          <p className="text-copy-sm governance-settings__hint">{t('governance.requireApprovalHint')}</p>
        </div>
        <label className="acc-switch">
          <input type="checkbox" checked={requireApproval} disabled={busy || !inviteLinkActive} onChange={toggleRequireApproval} aria-label={t('governance.requireApproval')} />
          <span className="acc-switch__track" aria-hidden="true" />
        </label>
      </div>

      <div className="governance-settings__row">
        <div>
          <span className="governance-settings__label">{t('governance.inviteLinkActive')}</span>
          <p className="text-copy-sm governance-settings__hint">{t('governance.inviteLinkActiveHint')}</p>
        </div>
        <label className="acc-switch">
          <input type="checkbox" checked={inviteLinkActive} disabled={busy} onChange={toggleLinkActive} aria-label={t('governance.inviteLinkActive')} />
          <span className="acc-switch__track" aria-hidden="true" />
        </label>
      </div>

      {inviteLinkActive && (
        <div className="governance-settings__link">
          <label className="dash-visually-hidden" htmlFor="governance-invite-link">{t('governance.inviteLinkUrl')}</label>
          <input id="governance-invite-link" className="field-control" readOnly value={inviteLink} onFocus={(event) => event.target.select()} dir="ltr" />
          <div className="governance-settings__link-actions">
            <button type="button" className="dash-btn dash-btn--secondary" onClick={copyLink}>
              {copied ? t('governance.copied') : t('governance.copyLink')}
            </button>
            <button type="button" className="dash-btn dash-btn--secondary" onClick={() => setRotateConfirmOpen(true)} disabled={busy}>
              {t('governance.rotateLink')}
            </button>
          </div>
        </div>
      )}

      {rotateConfirmOpen && (
        <ConfirmDialog
          title={t('governance.confirmRotateTitle')}
          body={t('governance.confirmRotateBody')}
          confirmLabel={t('governance.rotateLink')}
          onConfirm={confirmRotate}
          onCancel={() => !busy && setRotateConfirmOpen(false)}
        />
      )}
    </section>
  );
};

export default AccessSettingsCard;
