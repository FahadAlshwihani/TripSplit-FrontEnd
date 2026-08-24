import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from '../../features/profile/components/Avatar';
import { avatarKeyFromUser } from '../../features/profile/utils/avatarKey';
import { useAuth } from '../../auth/AuthContext';
import usePreferenceSave from '../../features/account/hooks/usePreferenceSave';

/*
  Replaces the old "Dashboard" nav link for an authenticated visitor.
  Theme/Language here call the exact same usePreferenceSave hook the
  Account page's own Preferences card uses -- one canonical save path,
  no second nav-only preference state. Implemented as an accessible
  disclosure (trigger + popover of normal focusable controls) rather than
  a strict ARIA `menu` widget, since Theme/Language are interactive
  selects, not a list of one-shot menu actions.
*/
const AccountMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { changeLanguage, changeTheme } = usePreferenceSave();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
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

  if (!user) return null;

  const goToAccount = () => {
    setOpen(false);
    navigate('/account');
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="account-menu__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="account-menu-panel"
      >
        <Avatar avatarKey={avatarKeyFromUser(user)} displayName={user.display_name} size="sm" />
        <span className="account-menu__name text-label">{user.display_name}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} account-menu__chevron`} aria-hidden="true" />
      </button>

      {open && (
        <div id="account-menu-panel" className="account-menu__panel" role="region" aria-label={user.display_name}>
          <div className="account-menu__header">
            <strong className="account-menu__identity-name text-copy">{user.display_name}</strong>
            <span className="account-menu__identity-email text-copy-sm">{user.email}</span>
          </div>

          <button type="button" className="account-menu__item" onClick={goToAccount}>
            {t('account.pageTitle')}
          </button>

          <div className="account-menu__divider" role="separator" />

          <div className="account-menu__row">
            <span className="text-label">{t('account.preferences.theme')}</span>
            <div className="account-menu__toggle" role="group" aria-label={t('account.preferences.theme')}>
              <button
                type="button"
                className={`account-menu__toggle-option${user.preferred_theme === 'light' ? ' is-active' : ''}`}
                aria-pressed={user.preferred_theme === 'light'}
                onClick={() => changeTheme('light')}
              >
                {t('account.preferences.themeLight')}
              </button>
              <button
                type="button"
                className={`account-menu__toggle-option${user.preferred_theme === 'dark' ? ' is-active' : ''}`}
                aria-pressed={user.preferred_theme === 'dark'}
                onClick={() => changeTheme('dark')}
              >
                {t('account.preferences.themeDark')}
              </button>
            </div>
          </div>

          <div className="account-menu__row">
            <span className="text-label">{t('account.preferences.language')}</span>
            <div className="account-menu__toggle" role="group" aria-label={t('account.preferences.language')}>
              <button
                type="button"
                className={`account-menu__toggle-option${user.preferred_language === 'en' ? ' is-active' : ''}`}
                aria-pressed={user.preferred_language === 'en'}
                onClick={() => changeLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`account-menu__toggle-option${user.preferred_language === 'ar' ? ' is-active' : ''}`}
                aria-pressed={user.preferred_language === 'ar'}
                onClick={() => changeLanguage('ar')}
              >
                AR
              </button>
            </div>
          </div>

          <div className="account-menu__divider" role="separator" />

          <button type="button" className="account-menu__item account-menu__item--danger" onClick={handleLogout}>
            {t('common.logOut')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
