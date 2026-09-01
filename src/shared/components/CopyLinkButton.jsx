import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './copyLinkButton.css';

/*
  Compact dashboard-native copy/share action -- reused wherever sending
  a direct link to another member is genuinely useful (Fund, a funding
  round, a settlement), never a generic "Share" button bolted onto
  every page. `url` must already be the full, canonical, short_code-
  based address (built by the caller from window.location.origin) --
  this component never constructs or guesses URLs itself.

  navigator.share is used opportunistically on the browsers that expose
  it (mainly mobile) -- clipboard copy is the universal fallback, never
  a hard requirement. A cancelled native share sheet (AbortError) is
  not a failure and shows no feedback at all.
*/
export default function CopyLinkButton({ url, label, compact = false, className }) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState(false);

  const handleClick = async (event) => {
    event.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
        // Fall through to clipboard copy below.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
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
      {feedback && <span className="copy-link-action__feedback" role="status" aria-live="polite">{t('common.linkCopied')}</span>}
    </span>
  );
}
