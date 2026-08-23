import React from 'react';
import './loadingSpinner.css';

/*
  The one canonical inline spinner — used inside any in-progress button
  app-wide (see LoadingButton.jsx). Its rotation is physical, not semantic:
  it must look identical in LTR and RTL. Give it its own dedicated class
  (never a bare `svg`) so a directional-icon RTL mirror rule elsewhere in
  the app can never accidentally recapture it the way auth.css's
  `[dir="rtl"] .auth-btn--primary svg` selector used to.
*/
const LoadingSpinner = ({ size = 14, className = '' }) => (
  <svg className={`loading-spinner ${className}`.trim()} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
    <path d="M14.5 8a6.5 6.5 0 00-6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default LoadingSpinner;
