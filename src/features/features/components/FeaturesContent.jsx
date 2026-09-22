import React from 'react';
import FeaturesHeader from './FeaturesHeader';
import SplitEngineSection from './SplitEngineSection';
import SettlementArchitectureSection from './SettlementArchitectureSection';
import '../styles/features.css';

const FeaturesContent = ({ embedded = false }) => {
  const Container = embedded ? 'section' : 'div';
  return (
    <Container className={`features-page${embedded ? ' features-page--embedded' : ''}`}>
      <FeaturesHeader headingLevel={embedded ? 'h2' : 'h1'} />
      <SplitEngineSection />
      <SettlementArchitectureSection />
    </Container>
  );
};

export default FeaturesContent;
