import React from 'react'; import { AuthProvider } from '../auth/AuthContext'; import LanguageProvider from '../components/LanguageProvider'; import { ThemeProvider } from '../components/ThemeProvider';
const AppProviders=({children})=><LanguageProvider><ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider></LanguageProvider>; export default AppProviders;
