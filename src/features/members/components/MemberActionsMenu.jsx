import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

/*
  Per-member "..." action menu -- anchored to its own trigger's real
  getBoundingClientRect(), portaled to document.body, RTL-aware via the
  document dir attribute. This is deliberately the SAME pattern as
  TripMoreActionsMenu (rect-anchored, position:fixed, portal, outside-
  click + Escape close, focus return to trigger) rather than the
  ExpenseFilterPopover-era mistake of a hardcoded viewport-relative
  offset that only ever looked right at the one spot it was eyeballed
  from. Every action rendered here comes from the member's own
  server-derived `capabilities` -- never a role guess -- so a denied
  action never even appears as a button to click.
*/
const MemberActionsMenu = ({ member, label, onPromote, onDemote, onTransfer, onRemove, onBan, onLeave }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const { isCurrentMember: isSelf, ...plainMember } = member;
  const caps = plainMember.capabilities || {};

  const close = () => setOpen(false);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isRtl = document.documentElement.dir === 'rtl';
    setPosition(
      isRtl
        ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 4, left: rect.left },
    );
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target)
        && panelRef.current && !panelRef.current.contains(event.target)
      ) close();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const act = (fn) => () => { close(); fn(plainMember); };
  const hasAnyAction = caps.can_promote || caps.can_demote || caps.can_transfer_ownership || caps.can_remove || caps.can_ban || isSelf;
  if (!hasAnyAction) return null;

  return (
    <div className="member-actions-menu">
      <button
        type="button"
        ref={triggerRef}
        className="member-actions-menu__trigger"
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? close() : openMenu())}
      >
        <i className="bi bi-three-dots-vertical" aria-hidden="true" />
      </button>
      {open && position && createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          className="member-actions-menu__panel"
          style={{ position: 'fixed', top: position.top, left: position.left, right: position.right }}
        >
          {caps.can_promote && <button type="button" role="menuitem" onClick={act(onPromote)}>{t('members.promote')}</button>}
          {caps.can_demote && <button type="button" role="menuitem" onClick={act(onDemote)}>{t('members.demote')}</button>}
          {caps.can_transfer_ownership && <button type="button" role="menuitem" onClick={act(onTransfer)}>{t('members.transfer')}</button>}
          {caps.can_remove && <button type="button" role="menuitem" onClick={act(onRemove)}>{t('members.remove')}</button>}
          {caps.can_ban && <button type="button" role="menuitem" className="member-actions-menu__danger" onClick={act(onBan)}>{t('governance.confirmBanAction')}</button>}
          {isSelf && <button type="button" role="menuitem" className="member-actions-menu__danger" onClick={act(onLeave)}>{t('members.leave')}</button>}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default MemberActionsMenu;
