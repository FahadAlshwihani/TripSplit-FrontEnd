import React from 'react'; import 'bootstrap-icons/font/bootstrap-icons.css'; import '../styles/App.css'; import '../styles/Header.css'; import '../styles/Footer.css'; import '../i18n'; import AppProviders from './providers'; import AppRouter from './routes';
const App=()=> <AppProviders><div className="app-container"><AppRouter/></div></AppProviders>; export default App;
