/**
 * Minimalist hairline status badge with subtle indicator dot.
 */

import React from 'react';

export default function StatusBadge({ state = 'idle', label }) {
  const displayLabel = label || state;

  return (
    <span className={`status-badge ${state}`}>
      <span className="dot" aria-hidden="true" />
      <span>{displayLabel}</span>
    </span>
  );
}

