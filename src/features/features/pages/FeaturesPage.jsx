import React from 'react';
import PublicLayout from '../../../components/Layout/PublicLayout';
import FeaturesHeader from '../components/FeaturesHeader';
import SplitEngineSection from '../components/SplitEngineSection';
import SettlementArchitectureSection from '../components/SettlementArchitectureSection';
import '../styles/features.css';

const FeaturesPage = () => (
  <PublicLayout>
    <div className="features-page">
      <FeaturesHeader />
      <SplitEngineSection />
      <SettlementArchitectureSection />
    </div>
  </PublicLayout>
);

export default FeaturesPage;
