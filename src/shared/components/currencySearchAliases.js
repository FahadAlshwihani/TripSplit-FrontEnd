// The backend currency catalog (apps/core/currencies.py) is English-only —
// ISO 4217 has no canonical Arabic names to pull from, and machine-
// translating all ~65 entries risks shipping wrong currency/country names.
// Instead: a small, individually-verified Arabic alias list covering the
// currencies an Arabic-speaking user is most likely to search for (Gulf +
// neighboring), so "السعودية"/"ريال" -> SAR works without claiming full
// Arabic localization of the whole catalog. Anything not listed here still
// matches by ISO code/English name/symbol regardless of UI language.
export const CURRENCY_SEARCH_ALIASES_AR = {
  SAR: ['السعودية', 'سعودي', 'ريال سعودي', 'ريال'],
  AED: ['الإمارات', 'اماراتي', 'درهم إماراتي', 'درهم'],
  QAR: ['قطر', 'قطري', 'ريال قطري'],
  KWD: ['الكويت', 'كويتي', 'دينار كويتي', 'دينار'],
  BHD: ['البحرين', 'بحريني', 'دينار بحريني'],
  OMR: ['عمان', 'عماني', 'ريال عماني'],
  JOD: ['الأردن', 'اردني', 'دينار أردني'],
  EGP: ['مصر', 'مصري', 'جنيه مصري', 'جنيه'],
  LBP: ['لبنان', 'لبناني', 'ليرة لبنانية', 'ليرة'],
  IQD: ['العراق', 'عراقي', 'دينار عراقي'],
  MAD: ['المغرب', 'مغربي', 'درهم مغربي'],
  TND: ['تونس', 'تونسي', 'دينار تونسي'],
  DZD: ['الجزائر', 'جزائري', 'دينار جزائري'],
  TRY: ['تركيا', 'تركي', 'ليرة تركية'],
  GEL: ['جورجيا', 'جورجي', 'لاري'],
  USD: ['أمريكا', 'دولار أمريكي', 'دولار'],
  EUR: ['أوروبا', 'يورو'],
  GBP: ['بريطانيا', 'المملكة المتحدة', 'جنيه إسترليني'],
  INR: ['الهند', 'هندي', 'روبية هندية', 'روبية'],
  PKR: ['باكستان', 'باكستاني', 'روبية باكستانية'],
};
