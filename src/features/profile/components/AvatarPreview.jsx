import React from 'react';
import Avatar from './Avatar';

// The onboarding-specific raised presentation (hard shadow, desktop-square/
// mobile-circle per the two approved Stitch references) lives in
// profileSetup.css as a wrapper around the plain canonical Avatar — every
// other Avatar consumer wants the flat mark, not this treatment.
const AvatarPreview = ({ avatarKey, displayName }) => (
  <div className="pf-preview">
    <Avatar avatarKey={avatarKey} displayName={displayName} size="lg" className="pf-preview__avatar" />
  </div>
);

export default AvatarPreview;
