import { createPortal } from 'react-dom';

/*
  Renders children directly under document.body instead of wherever the
  caller sits in the tree. Required for any full-screen dialog/backdrop
  that might be mounted inside a pressable card or row: those cards use
  `transform` on hover (the global Neo-classic press system), and a
  transformed ancestor becomes the containing block for any
  `position: fixed` descendant per the CSS spec -- so without a portal, a
  fixed-position overlay gets trapped inside (and clipped/mispositioned
  by) that ancestor's own small box the moment it's hovered, instead of
  covering the viewport. Portaling removes the ancestor relationship
  entirely, the same fix already used for TripMoreActionsMenu's popover.
*/
const ModalPortal = ({ children }) => createPortal(children, document.body);

export default ModalPortal;
