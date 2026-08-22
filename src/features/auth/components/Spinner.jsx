import React from 'react';

// Small inline spinner shared by every async auth action's loading state.
// Respects prefers-reduced-motion via CSS (auth.css stops the rotation;
// the button's own changed text already communicates "in progress").
const Spinner = () => (
  <svg className="auth-spinner" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M14.5 8a6.5 6.5 0 00-6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default Spinner;
