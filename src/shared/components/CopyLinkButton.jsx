import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './copyLinkButton.css';

/*
  Compact dashboard-native copy/share action -- reused wherever sending
  a direct link (or a full human share message built around one) to
  another member is genuinely useful, never a generic "Share" button
  bolted onto every page.

  `url` (a bare link) or `text` (a complete message, e.g. from
  shareMessage.js's buildTripShareMessage -- already including the URL
  inline) is the value actually copied/shared; this component never
  constructs or guesses either itself. When `text` is given, Web Share
  gets `{ text }` (never also `url`, which would duplicate the link a
  second time in share sheets that render them separately).

  navigator.share is used opportunistically on the browsers that expose
  it (mainly mobile) -- clipboard copy is the universal fallback, never
  a hard requirement. Set `enableShare={false}` to force clipboard-only
  (used for copying a password: a native share sheet routes it through
  other apps/OS activity logs, which is never appropriate for a
  secret). A cancelled native share sheet (AbortError) is not a failure
  and shows no feedback at all.
*/
export default function CopyLinkButton({ url, text, label, compact = false, className, successMessage, enableShare = true }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState(false);
  const value = text || url;

  const handleClick = async (event) => {
    event.stopPropagation();
    if (enableShare && navigator.share) {
      try {
        await navigator.share(text ? { text } : { url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
        // Fall through to clipboard copy below.
      }
    }
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(true);
      window.setTimeout(() => setFeedback(false), 2500);
    } catch {
      // Clipboard permission can be denied in some embedded/older
      // browsers -- silently no-op rather than throwing an alert().
    }
  };

  return (
    <span className="copy-link-action">
      <button
        type="button"
        className={className || `dash-btn dash-btn--secondary${compact ? ' copy-link-action__btn--compact' : ''}`}
        onClick={handleClick}
        aria-label={label || t('common.copyLink')}
      >
        <i className="bi bi-link-45deg" aria-hidden="true" />
        {!compact && <span aria-hidden="true">{label || t('common.copyLink')}</span>}
      </button>
      {feedback && <span className="copy-link-action__feedback" role="status" aria-live="polite">{successMessage || t('common.linkCopied')}</span>}
    </span>
  );
}
