import React from 'react';
import PublicLayout from '../../../components/Layout/PublicLayout';
import Hero from '../components/Hero';
import ProductPreview from '../components/ProductPreview';
import '../styles/home.css';

const HomePage = () => (
  <PublicLayout>
    <Hero />
    <ProductPreview />
  </PublicLayout>
);

export default HomePage;
