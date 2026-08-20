import React from 'react'; import { AuthProvider } from '../auth/AuthContext'; import LanguageProvider from '../components/LanguageProvider';
const AppProviders=({children})=><LanguageProvider><AuthProvider>{children}</AuthProvider></LanguageProvider>; export default AppProviders;
