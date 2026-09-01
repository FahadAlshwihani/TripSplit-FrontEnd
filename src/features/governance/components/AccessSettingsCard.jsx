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
const AccessSettingsCard = ({ trip, onUpdateSettings, onRotateLink, capabilities }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Omitted entirely (e.g. existing tests that render this card in
  // isolation) means "fully allowed" -- this card only ever renders in
  // production behind GovernancePage's own can_view_governance gate,
  // which is the same underlying check every one of these flags
  // collapses to today (see apps.trips.permissions.governance_capabilities).
  const canManageApproval = capabilities ? Boolean(capabilities.can_manage_approval_setting) : true;
  const canManageLink = capabilities ? Boolean(capabilities.can_manage_invite_link) : true;

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
    <section className="gov-settings">
      <h3 className="gov-settings__title">{t('governance.accessSettings')}</h3>

      <div className="gov-settings__rows">
        <div className="gov-settings__row">
          <span className="gov-settings__row-label">{t('governance.requireApproval')}</span>
          <label className="gov-switch">
            <input type="checkbox" checked={requireApproval} disabled={busy || !inviteLinkActive || !canManageApproval} onChange={toggleRequireApproval} aria-label={t('governance.requireApproval')} />
            <span className="gov-switch__track" aria-hidden="true" />
          </label>
        </div>

        <div className="gov-settings__row">
          <span className="gov-settings__row-label">{t('governance.inviteLinkActive')}</span>
          <label className="gov-switch">
            <input type="checkbox" checked={inviteLinkActive} disabled={busy || !canManageLink} onChange={toggleLinkActive} aria-label={t('governance.inviteLinkActive')} />
            <span className="gov-switch__track" aria-hidden="true" />
          </label>
        </div>
      </div>

      {inviteLinkActive && (
        <div className="gov-settings__link">
          <span className="gov-settings__link-label">{t('governance.inviteLinkUrl')}</span>
          <div className="gov-settings__link-row">
            <label className="dash-visually-hidden" htmlFor="governance-invite-link">{t('governance.inviteLinkUrl')}</label>
            <input id="governance-invite-link" className="gov-settings__link-code" readOnly value={inviteLink} onFocus={(event) => event.target.select()} dir="ltr" title={inviteLink} />
            {canManageLink && (
              <div className="gov-settings__link-actions">
                <button type="button" className="gov-btn" onClick={copyLink}>
                  {copied ? t('governance.copied') : t('governance.copyLink')}
                </button>
                <button type="button" className="gov-btn" onClick={() => setRotateConfirmOpen(true)} disabled={busy}>
                  {t('governance.rotateLink')}
                </button>
              </div>
            )}
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
