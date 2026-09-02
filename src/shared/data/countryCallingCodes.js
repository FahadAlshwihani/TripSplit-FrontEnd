// A curated, Gulf/MENA-first list, not the full ITU-T assignment table --
// same "verified priority list, not a claim of exhaustive coverage"
// approach as currencySearchAliases.js. `dial` is what gets submitted as
// phone_country_code; `code` only distinguishes otherwise-identical
// entries (e.g. US/CA both dial +1) as a stable React key.
export const COUNTRY_CALLING_CODES = [
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'GE', dial: '+995', flag: '🇬🇪', name: 'Georgia' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
];

export const DEFAULT_COUNTRY_CALLING_CODE = '+966';
