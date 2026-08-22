import React from 'react';
import './avatar.css';
import { avatarGlyph } from '../../../shared/utils/avatars';
import { avatarColorToken, DEFAULT_AVATAR_COLOR_ID } from '../data/avatarColors';
import { getInitials } from '../utils/initials';
import { decodeInitialsKey, decodeDicebearKey } from '../utils/avatarKey';
import useDicebearAvatar from '../hooks/useDicebearAvatar';

/*
  The one canonical avatar renderer — every surface that shows a member's
  avatar should use this instead of calling avatarGlyph() directly, so
  every avatar_key format (see avatarKey.js) renders correctly everywhere,
  not only in onboarding.

    "initials_<colorId>"   → live initials computed from displayName,
      never stored — so a later display-name change can't leave a stale
      pair of letters behind.
    "dicebear_<style>_<seed>_<animation>" → generated on demand via
      useDicebearAvatar (lazy-loads only that one style's chunk). Falls
      back to an initials rendering if generation fails, per the "no
      broken image icons" requirement — never a broken <img>.
    anything else (legacy "avatar_01".."avatar_12", or unrecognized)
      → falls through to the original emoji-glyph rendering, so every
      existing guest/legacy member keeps rendering exactly as before.
*/
const Avatar = ({ avatarKey, displayName, size = 'md', className = '' }) => {
  const classes = `pf-avatar pf-avatar--${size} ${className}`.trim();

  const initialsColorId = decodeInitialsKey(avatarKey);
  const dicebearConfig = decodeDicebearKey(avatarKey);

  const dicebearState = useDicebearAvatar(
    dicebearConfig ? { style: dicebearConfig.style, seed: dicebearConfig.seed, size: 128 } : {},
  );

  if (initialsColorId !== null) {
    return (
      <span className={`${classes} pf-avatar--initials`} style={{ background: avatarColorToken(initialsColorId) }}>
        {getInitials(displayName)}
      </span>
    );
  }

  if (dicebearConfig) {
    if (dicebearState.status === 'ready') {
      const animClass = dicebearConfig.animation !== 'none' ? ` pf-avatar--anim-${dicebearConfig.animation}` : '';
      return <img className={`${classes} pf-avatar--dicebear${animClass}`} src={dicebearState.dataUri} alt="" />;
    }
    if (dicebearState.status === 'error') {
      // Fallback to an initials-style rendering rather than a broken
      // image or an empty box — uses the default palette color since a
      // failed dicebear key carries no color of its own to fall back to.
      return (
        <span className={`${classes} pf-avatar--initials`} style={{ background: avatarColorToken(DEFAULT_AVATAR_COLOR_ID) }}>
          {getInitials(displayName)}
        </span>
      );
    }
    return <span className={`${classes} pf-avatar--loading`} aria-hidden="true" />;
  }

  return <span className={`${classes} pf-avatar--glyph`}>{avatarGlyph(avatarKey)}</span>;
};

export default Avatar;
