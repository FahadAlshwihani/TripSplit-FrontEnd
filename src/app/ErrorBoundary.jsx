import React from 'react';

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { if (process.env.NODE_ENV !== 'production') console.error('Application render failure', error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="home-container-pc"><section className="card-pc error-message" role="alert"><h1>Something went wrong</h1><p>The application could not render this screen.</p><button type="button" onClick={() => this.setState({ failed: false })}>Try again</button><a href="/">Go home</a></section></main>;
  }
}
export default ErrorBoundary;
