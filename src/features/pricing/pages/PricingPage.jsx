import React from 'react';
import PublicLayout from '../../../components/Layout/PublicLayout';
import PricingReceipt from '../components/PricingReceipt';
import '../styles/pricing.css';

const PricingPage = () => (
  <PublicLayout>
    <div className="pricing">
      <div className="pricing__texture" aria-hidden="true" />
      <PricingReceipt />
    </div>
  </PublicLayout>
);

export default PricingPage;
