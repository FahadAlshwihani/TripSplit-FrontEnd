import React from 'react';
import PublicNav from '../components/PublicNav';
import Hero from '../components/Hero';
import ProductPreview from '../components/ProductPreview';
import GetStarted from '../components/GetStarted';
import PublicFooter from '../components/PublicFooter';
import '../styles/home.css';

const HomePage = () => (
  <div className="home-page">
    <PublicNav />
    <main>
      <Hero />
      <ProductPreview />
      <GetStarted />
    </main>
    <PublicFooter />
  </div>
);

export default HomePage;
