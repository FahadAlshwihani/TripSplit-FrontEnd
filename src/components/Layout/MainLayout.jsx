// FileName: MultipleFiles/MainLayout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

// The legacy animated background is scoped to this layout only — pages
// using the new PublicLayout never mount MainLayout, so they never render
// (or inherit) this background. See src/styles/App.css for .area/.circles.
const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto p-4 max-w-md text-right legacy-layout">
      <div className="area"><ul className="circles">{[...Array(10)].map((_, i) => <li key={i} />)}</ul></div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
