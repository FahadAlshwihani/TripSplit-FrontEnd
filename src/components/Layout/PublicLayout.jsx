import React from 'react';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';
import '../../styles/PublicLayout.css';

const PublicLayout = ({ children }) => (
  <div className="public-layout">
    <PublicNav />
    <main className="public-layout__main">{children}</main>
    <PublicFooter />
  </div>
);

export default PublicLayout;
