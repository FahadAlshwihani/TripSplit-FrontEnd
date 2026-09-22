import React from 'react';
import PricingReceipt from './PricingReceipt';
import '../styles/pricing.css';

const PricingContent = ({ embedded = false }) => {
  const Container = embedded ? 'section' : 'div';
  return (
    <Container className={`pricing${embedded ? ' pricing--embedded' : ''}`}>
      <div className="pricing__texture" aria-hidden="true" />
      <PricingReceipt headingLevel={embedded ? 'h2' : 'h1'} />
    </Container>
  );
};

export default PricingContent;
