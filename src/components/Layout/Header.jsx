// FileName: MultipleFiles/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaLinkedin, FaGithub, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { US, SA } from 'country-flag-icons/react/3x2';
import '../../styles/Header.css';


const Header = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language); // Initialize with current i18n language
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang); // Change i18n language
    setLanguage(lang);
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = isMenuOpen ? 'auto' : 'hidden';
    setIsDropdownOpen(false); // Close dropdown when menu opens/closes
  };

  useEffect(() => {
    const timeout = timeoutRef.current;
    const handleClickOutside = (event) => {
      // For desktop language dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }

      // For mobile menu
      if (menuRef.current && !menuRef.current.contains(event.target) &&
        !event.target.classList.contains('header__burger')) {
        setIsMenuOpen(false);
        document.body.style.overflow = 'auto';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <header className="header">
      <div className="header__container" ref={menuRef}>
        <div className="header__left">
            <Link to="/" className="header__logo">
              {/* Logo image with fallback text */}
              <img
                src={require('../../images/wallet.png')} // Using require() ensures correct path
                alt="Kattna"
                className="logo-image"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide broken image
                }}
              />
              <h1 className="glowing-title">{t('header.title')}</h1>
            </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="header__desktop">
          <nav className="nav">
            <Link to="/" className="nav__item">
              {t('Home')}
            </Link>
            <Link to="/about" className="nav__item">
              {t('About')}
            </Link>
          </nav>

          <div className="nav__social">
            <a href="https://linkedin.com/in/fahad-alshwihani" target="_blank" rel="noopener noreferrer" className="nav__icon">
              <FaLinkedin />
            </a>
            <a href="https://github.com/FahadAlshwihani" target="_blank" rel="noopener noreferrer" className="nav__icon">
              <FaGithub />
            </a>
          </div>

          <div className="nav__language" ref={dropdownRef}>
            <button
              className="nav__language-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
            >
              <div className="current-language">
                {language === 'en' ? <US className="flag-icon" /> : <SA className="flag-icon" />}
                <span className="language-text">{language === 'ar' ? 'العربية' : 'English'}</span>
                <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
              </div>
            </button>

            <div className={`nav__language-dropdown ${isDropdownOpen ? 'visible' : ''}`}>
              <button
                onClick={() => handleLanguageChange('en')}
                className={language === 'en' ? 'active' : ''}
              >
                <US className="flag-icon" />
                <span>English</span>
                {language === 'en' && <span className="active-indicator"></span>}
              </button>
              <button
                onClick={() => handleLanguageChange('ar')}
                className={language === 'ar' ? 'active' : ''}
              >
                <SA className="flag-icon" />
                <span>العربية</span>
                {language === 'ar' && <span className="active-indicator"></span>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Burger Button */}
        <button
          className="header__burger"
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Mobile Navigation */}
        <div className={`header__mobile ${isMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-nav">
            <Link to="/" className="mobile-nav__item" onClick={toggleMenu}>
              {t('Home')}
            </Link>
            <Link to="/about" className="mobile-nav__item" onClick={toggleMenu}>
              {t('About')}
            </Link>

            <div className="mobile-nav__social">
              <a href="https://linkedin.com/in/fahad-alshwihani" target="_blank" rel="noopener noreferrer" className="mobile-nav__icon">
                <FaLinkedin />
              </a>
              <a href="https://github.com/FahadAlshwihani" target="_blank" rel="noopener noreferrer" className="mobile-nav__icon">
                <FaGithub />
              </a>
            </div>

            <div className="mobile-nav__language">
              <button
                className="mobile-nav__language-toggle"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
              >
                {language === 'en' ? <US className="flag-icon" /> : <SA className="flag-icon" />}
                <span>{language === 'ar' ? 'العربية' : 'English'}</span>
                <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} />
              </button>

              <div className={`mobile-nav__language-dropdown ${isDropdownOpen ? 'visible' : ''}`}>
                <button onClick={() => handleLanguageChange('en')}>
                  <US className="flag-icon" />
                  <span>English</span>
                  {language === 'en' && <span className="active-indicator"></span>}
                </button>
                <button onClick={() => handleLanguageChange('ar')}>
                  <SA className="flag-icon" />
                  <span>العربية</span>
                  {language === 'ar' && <span className="active-indicator"></span>}
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
