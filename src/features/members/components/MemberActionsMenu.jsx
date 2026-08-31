import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Matches .member-actions-menu__panel's own min-width (see members.css) --
// the panel isn't mounted yet when a click computes its position (open
// state flips the SAME render pass the panel appears in), so there's no
// real rect to measure yet. Same single-pass estimate convention
// ExpenseFilterPopover already uses for its own vertical-flip decision,
// applied here to both axes.
const MENU_WIDTH_ESTIMATE = 200;
const MENU_HEIGHT_ESTIMATE = 260;
const VIEWPORT_MARGIN = 8;

/*
  Per-member "..." action menu -- anchored to its own trigger's real
  getBoundingClientRect(), portaled to document.body (so no ancestor's
  overflow:hidden -- e.g. .mem-list's rounded-corner clipping -- can
  ever clip it), RTL-aware via the document dir attribute.

  Direction sets which side the menu PREFERS to expand toward (RTL:
  toward the trigger's visual left, i.e. its own right edge anchored to
  the trigger's right edge; LTR: the mirror) -- but that preference is
  then hard-clamped against the actual viewport width, because a trigger
  sitting near the screen edge in its own preferred-expansion direction
  (which is common: row actions live at the row's inline-end, i.e. the
  physical LEFT edge in RTL, physical RIGHT edge in LTR -- exactly the
  edge each direction naturally prefers to expand INTO) would otherwise
  push the panel half off-screen. Viewport collision always wins over
  the direction-implied default, per the fix this component exists for.
  Vertical placement flips above the trigger under the same rule
  (insufficient room below), mirroring ExpenseFilterPopover's own
  single-pass estimate-then-flip approach rather than a second, new
  positioning system.
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

    const preferredLeft = isRtl ? rect.right - MENU_WIDTH_ESTIMATE : rect.left;
    const maxLeft = window.innerWidth - MENU_WIDTH_ESTIMATE - VIEWPORT_MARGIN;
    const left = Math.min(Math.max(preferredLeft, VIEWPORT_MARGIN), Math.max(maxLeft, VIEWPORT_MARGIN));

    const flipAbove = window.innerHeight - rect.bottom < MENU_HEIGHT_ESTIMATE + VIEWPORT_MARGIN;
    const vertical = flipAbove
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 };

    setPosition({ ...vertical, left });
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
          style={{ position: 'fixed', top: position.top, bottom: position.bottom, left: position.left }}
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
