/**
 * Minimalist 1px ring spinner and editorial "Thinking" indicator with fading dots.
 */

import React from 'react';

export function Spinner({ size = 20 }) {
  return (
    <span
      className="editorial-spinner"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="Loading"
    />
  );
}

export function Thinking() {
  return (
    <div className="thinking-indicator" role="status" aria-live="polite">
      <span>Thinking</span>
      <span className="thinking-dot">.</span>
      <span className="thinking-dot">.</span>
      <span className="thinking-dot">.</span>
    </div>
  );
}

export default Spinner;

