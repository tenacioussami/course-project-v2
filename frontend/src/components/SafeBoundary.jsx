import { Component } from 'react';

/**
 * If anything inside crashes (e.g. an animation), show `fallback`
 * instead of taking down the whole page.
 */
class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.warn('Animation hidden after an error:', err);
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}

export default SafeBoundary;