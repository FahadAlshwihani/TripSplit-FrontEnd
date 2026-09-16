import React from 'react';
import PublicLayout from '../../../components/Layout/PublicLayout';
import Hero from '../components/Hero';
import ProductPreview from '../components/ProductPreview';
import HomeGuide from '../components/HomeGuide';
import '../styles/home.css';

const HomePage = () => (
  <PublicLayout>
    <Hero />
    <ProductPreview />
    <HomeGuide />
  </PublicLayout>
);

export default HomePage;
