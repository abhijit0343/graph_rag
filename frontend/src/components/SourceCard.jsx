/**
 * Source card displaying grounding context passage with editorial spotlight hover.
 */

import React from 'react';
import { FileText } from 'lucide-react';

export default function SourceCard({ index, chunk }) {
  const numStr = String(index + 1).padStart(2, '0');

  return (
    <div className="editorial-card" style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          borderBottom: '1px solid var(--ash-200)',
          paddingBottom: '8px',
        }}
      >
        <span className="meta-label" style={{ color: 'var(--accent)' }}>
          Source {numStr}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} strokeWidth={1.25} color="var(--ash-600)" />
          <span className="meta-label" style={{ color: 'var(--ash-600)' }}>
            {chunk.file || 'Document'}
          </span>
        </div>
      </div>
      <p
        style={{
          fontSize: '13.5px',
          lineHeight: '1.6',
          color: 'var(--ash-900)',
          whiteSpace: 'pre-line',
        }}
      >
        {chunk.text}
      </p>
      {chunk.id && (
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <span style={{ fontSize: '10px', color: 'var(--ash-400)', fontFamily: 'monospace' }}>
            {chunk.id}
          </span>
        </div>
      )}
    </div>
  );
}

