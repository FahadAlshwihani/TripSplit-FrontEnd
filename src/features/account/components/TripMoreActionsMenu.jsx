import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

/*
  A trip ledger row sits inside .acc-trip, which needs `overflow: hidden`
  to clip its two background zones (main/aside) to one shared rounded
  corner -- but that same overflow:hidden also clips any absolutely-
  positioned popover anchored inside it the moment the popover extends
  past the row's own (intentionally short) box, which is essentially
  guaranteed for a multi-row action list under a trigger near the bottom
  of a compact row. Rendering the popover through a portal to
  document.body sidesteps that clipping entirely (it's no longer a
  descendant of .acc-trip at all) and puts it in the root stacking
  context, above every sibling trip row regardless of DOM order.
*/
const TripMoreActionsMenu = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const location = useLocation();

  const close = () => setOpen(false);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const isRtl = document.documentElement.dir === 'rtl';
    if (rect) {
      setPosition(
        isRtl
          ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 4, left: rect.left }
      );
    }
    setOpen(true);
  };

  // Closes on navigation, per the required popover behavior -- none of
  // this menu's own actions currently navigate away (they're all
  // same-page API calls), but a reusable menu component shouldn't assume
  // that stays true forever.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { close(); }, [location.pathname]);

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

  return (
    <div className="acc-trip__more">
      <button
        type="button"
        ref={triggerRef}
        className="acc-trip__more-trigger"
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
          className="acc-trip__more-actions"
          style={{ position: 'fixed', top: position.top, left: position.left, right: position.right }}
        >
          {children({ close })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TripMoreActionsMenu;
