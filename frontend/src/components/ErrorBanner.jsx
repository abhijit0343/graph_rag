/**
 * Editorial error callout banner with clean typography and hairline accent.
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss, title = 'Attention' }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={18} strokeWidth={1.25} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div className="error-title">{title}</div>
        <div className="error-msg">{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px',
            color: 'var(--ash-600)',
          }}
        >
          <X size={16} strokeWidth={1.25} />
        </button>
      )}
    </div>
  );
}

