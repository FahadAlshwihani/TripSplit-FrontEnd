import React from 'react';
const ErrorState = ({ title = 'Unable to load this section', message, onRetry }) => <div className="error-message" role="alert"><strong>{title}</strong>{message && <p>{message}</p>}{onRetry && <button type="button" onClick={onRetry}>Try again</button>}</div>;
export default ErrorState;
