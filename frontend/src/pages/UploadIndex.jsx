/**
 * Page 01 / Upload & Index (Forest Theme Edition)
 * Sets document.body.dataset.theme = "forest" on mount and cleans up on unmount.
 * Features monumental Cormorant Garamond headline ("Turn / documents / into knowledge."),
 * overflow-masked line-by-line reveal, muted beige subtitle, and floating dark forest (#133224)
 * panels with sand (#D8C39A) accents and beige-filled primary buttons.
 */

import React, { useState, useEffect } from 'react';
import { UploadCloud, File, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import Reveal from '../components/Reveal';
import MagneticButton from '../components/MagneticButton';
import StatusBadge from '../components/StatusBadge';
import ErrorBanner from '../components/ErrorBanner';

export default function UploadIndex() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading' | 'uploaded'
  const [errorMsg, setErrorMsg] = useState(null);

  // Set forest theme on this page only
  useEffect(() => {
    document.body.dataset.theme = 'forest';
    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  // Indexing status state
  const [indexState, setIndexState] = useState({
    state: 'idle',
    stage: 'Awaiting documents',
    percent: 0,
    counts: { chunks: 0, entities: 0, relations: 0, communities: 0 },
    error: null,
  });

  // Poll status when indexing is running
  usePolling(
    async () => {
      try {
        const resp = await apiClient.get('/index/status');
        setIndexState(resp.data);
        if (resp.data.error) {
          setErrorMsg(resp.data.error);
        }
      } catch (err) {
        // Silently handle polling disconnect
      }
    },
    2000,
    indexState.state === 'running' || indexState.state === 'idle'
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setErrorMsg(null);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setErrorMsg(null);
    }
  };

  const handleUploadAndIndex = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select at least one .txt, .md, or .pdf document.');
      return;
    }

    try {
      setErrorMsg(null);
      setUploadStatus('uploading');

      // 1. Upload files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadStatus('uploaded');

      // 2. Trigger background indexing
      await apiClient.post('/index');
      setIndexState((prev) => ({
        ...prev,
        state: 'running',
        stage: 'Initializing pipeline...',
        percent: 5,
      }));
    } catch (err) {
      setErrorMsg(err.message);
      setUploadStatus(null);
    }
  };

  const isIndexing = indexState.state === 'running';

  return (
    <div className="page-wrapper" style={{ paddingTop: '16px' }}>
      {/* Monumental Hero Section */}
      <section
        style={{
          backgroundColor: '#133224',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid rgba(239, 230, 208, 0.16)',
          boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.5)',
          padding: '56px 48px 116px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Numbered Category Header */}
        <div
          className="numbered-section"
          style={{
            color: '#BDB296',
            marginBottom: '24px',
            fontSize: '11.5px',
            letterSpacing: '0.14em',
          }}
        >
          <span className="num" style={{ color: '#D8C39A' }}>01</span> / <span>Document Ingestion & Knowledge Synthesis</span>
        </div>

        {/* 3-Line Masked Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(64px, 11.5vw, 190px)',
            lineHeight: 0.92,
            letterSpacing: '-0.035em',
            color: '#EFE6D0',
            fontWeight: 500,
            margin: '0 0 16px 0',
          }}
        >
          <div className="hero-line-mask">
            <div className="hero-line-inner hero-line-1">
              Turn
            </div>
          </div>
          <div className="hero-line-mask">
            <div className="hero-line-inner hero-line-2">
              <span
                style={{
                  fontStyle: 'italic',
                  color: '#D8C39A',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                documents
              </span>
            </div>
          </div>
          <div className="hero-line-mask">
            <div className="hero-line-inner hero-line-3">
              into knowledge.
            </div>
          </div>
        </h1>

        {/* Fading Subtitle in Muted Beige */}
        <p className="hero-subtitle">
          Local GraphRAG extracts entities and semantic relations into NetworkX, groups them via Louvain community detection, and generates structured hierarchical summaries.
        </p>
      </section>

      {/* Floating Drop Zone: Overlaps Hero Band by 60px */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          marginTop: '-60px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: '#133224',
          border: isDragging
            ? '1px dashed #D8C39A'
            : '1px dashed rgba(239, 230, 208, 0.22)',
          boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.55)',
          padding: '52px 24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-xs)',
          transition: 'border-color var(--trans-smooth), background-color var(--trans-smooth), box-shadow var(--trans-smooth)',
          marginBottom: '36px',
        }}
      >
        <UploadCloud
          size={38}
          strokeWidth={1.25}
          color="#D8C39A"
          style={{ margin: '0 auto 16px' }}
        />
        <h3 style={{ fontSize: '22px', marginBottom: '8px', color: '#EFE6D0' }}>
          Drag & drop documents here
        </h3>
        <p style={{ color: '#BDB296', fontSize: '13.5px', marginBottom: '22px' }}>
          Supports .txt, .md, and .pdf documents
        </p>
        <label className="btn btn-secondary" style={{ display: 'inline-flex' }}>
          <span>Select files from disk</span>
          <input
            type="file"
            multiple
            accept=".txt,.md,.pdf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isIndexing}
          />
        </label>
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <Reveal delay={0}>
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        </Reveal>
      )}

      {/* Selected File List */}
      {files.length > 0 && (
        <Reveal delay={120}>
          <div style={{ marginBottom: '36px' }}>
            <div className="meta-label" style={{ marginBottom: '12px', color: '#BDB296' }}>
              Selected Documents ({files.length})
            </div>
            <div
              style={{
                backgroundColor: '#133224',
                border: '1px solid rgba(239, 230, 208, 0.16)',
                boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.45)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
              }}
            >
              {files.map((file, idx) => (
                <div
                  key={file.name + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: idx === files.length - 1 ? 'none' : '1px solid rgba(239, 230, 208, 0.16)',
                    backgroundColor: '#133224',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <File size={16} strokeWidth={1.25} color="#D8C39A" />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#EFE6D0' }}>
                      {file.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8C846E' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Action Row */}
      <Reveal delay={160}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <MagneticButton
            onClick={handleUploadAndIndex}
            disabled={isIndexing || files.length === 0}
            className="btn btn-primary"
          >
            <span>{isIndexing ? 'Indexing in progress...' : 'Begin indexing'}</span>
            <ArrowRight size={16} strokeWidth={1.25} />
          </MagneticButton>

          <StatusBadge state={indexState.state} label={indexState.stage} />
        </div>
      </Reveal>

      {/* Progress Line */}
      {(isIndexing || indexState.percent > 0) && (
        <Reveal delay={200}>
          <div
            style={{
              backgroundColor: '#133224',
              border: '1px solid rgba(239, 230, 208, 0.16)',
              boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.45)',
              padding: '20px 24px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '56px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                alignItems: 'baseline',
              }}
            >
              <span className="meta-label" style={{ color: '#BDB296' }}>{indexState.stage}</span>
              <span className="meta-label" style={{ color: '#D8C39A', fontWeight: 700 }}>
                {indexState.percent}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '3px',
                backgroundColor: 'rgba(239, 230, 208, 0.1)',
                position: 'relative',
                borderRadius: '1px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${indexState.percent}%`,
                  backgroundColor: '#D8C39A',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        </Reveal>
      )}

      {/* Four Big Serif Statistic Counters inside Floating Dark Forest Panel */}
      <Reveal delay={240}>
        <section
          style={{
            backgroundColor: '#133224',
            border: '1px solid rgba(239, 230, 208, 0.16)',
            boxShadow: '0 30px 60px -30px rgba(0, 0, 0, 0.45)',
            borderRadius: 'var(--radius-xs)',
            padding: '44px 36px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}
          >
            {[
              { label: 'Chunks Ingested', value: indexState.counts?.chunks || 0 },
              { label: 'Entities Extracted', value: indexState.counts?.entities || 0 },
              { label: 'Relations Linked', value: indexState.counts?.relations || 0 },
              { label: 'Communities Detected', value: indexState.counts?.communities || 0 },
            ].map((stat, idx) => (
              <div
                key={stat.label}
                style={{
                  borderRight: idx === 3 ? 'none' : '1px solid rgba(239, 230, 208, 0.16)',
                  paddingRight: '20px',
                }}
              >
                <div className="meta-label" style={{ marginBottom: '8px', color: '#BDB296' }}>
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '52px',
                    fontWeight: 500,
                    lineHeight: 1,
                    color: stat.value > 0 ? '#D8C39A' : '#EFE6D0',
                  }}
                >
                  {stat.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
