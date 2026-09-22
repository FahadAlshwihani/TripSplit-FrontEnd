import React from 'react';
import PublicLayout from '../../../components/Layout/PublicLayout';
import Hero from '../components/Hero';
import ProductPreview from '../components/ProductPreview';
import FeaturesContent from '../../features/components/FeaturesContent';
import PricingContent from '../../pricing/components/PricingContent';
import '../styles/home.css';

const HomePage = () => (
  <PublicLayout>
    <Hero />
    <ProductPreview />
    <FeaturesContent embedded />
    <PricingContent embedded />
  </PublicLayout>
);

export default HomePage;
