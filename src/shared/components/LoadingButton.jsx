import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import './loadingButton.css';

/*
  Canonical loading-submit-button wrapper — reused by every async submit
  action app-wide (OTP send/verify, Complete/Guest Profile Setup save,
  Create Trip, Join Trip, invitation acceptance, profile saves) instead of
  each screen hand-rolling its own spinner/text-swap.

  Intentionally NOT a styled button of its own: it only adds the
  loading-behavioral concerns (spinner+label swap, aria-busy, duplicate-
  submit prevention via `disabled`, a flex layout that keeps the spinner
  and label visually balanced with `gap` rather than physical margins, so
  it looks correct in RTL with no extra work) on top of whatever visual
  button classes the caller passes in via `className` — width, height,
  border, hard shadow, background, and alignment all stay exactly what
  that class already defines, in both the idle and loading states.
*/
const LoadingButton = ({ loading, loadingLabel, children, className = '', type = 'submit', disabled, ...rest }) => (
  <button
    type={type}
    className={`loading-btn ${className}`.trim()}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {loading ? (
      <>
        <LoadingSpinner />
        <span>{loadingLabel}</span>
      </>
    ) : children}
  </button>
);

export default LoadingButton;
