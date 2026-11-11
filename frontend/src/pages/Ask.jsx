/**
 * Page 02 / Ask
 * Editorial search interface featuring 28px serif input, Auto/Local/Global segmented control,
 * serif answer narrative, thumbs feedback, source cards, and local subgraph visualizer.
 * All panels float in pure white above the warm light ash background.
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ArrowUpRight, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';
import Reveal from '../components/Reveal';
import MagneticButton from '../components/MagneticButton';
import SourceCard from '../components/SourceCard';
import GraphView from '../components/GraphView';
import ErrorBanner from '../components/ErrorBanner';
import { Thinking } from '../components/Spinner';

export default function Ask() {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' | 'local' | 'global'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(null); // 1 | 0 | null

  // Query Result State
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const cleanQ = question.trim();
    if (!cleanQ || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setFeedbackSent(null);

    try {
      const response = await apiClient.post('/query', {
        question: cleanQ,
        mode,
        k: 5,
        hops: 2,
      });
      setResult(response.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (score) => {
    if (!result?.run_id || feedbackSent !== null) return;
    try {
      await apiClient.post('/feedback', {
        run_id: result.run_id,
        score,
      });
      setFeedbackSent(score);
    } catch (err) {
      // Non-blocking
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <section style={{ marginBottom: '36px' }}>
        <Reveal delay={0}>
          <div className="numbered-section">
            <span className="num">02</span> / <span>Query Interface</span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h1 style={{ fontSize: '42px', marginBottom: '8px' }}>Ask the Knowledge Graph</h1>
        </Reveal>
        <Reveal delay={120}>
          <p style={{ color: 'var(--ash-600)', fontSize: '15.5px' }}>
            Local search traverses graph neighborhoods; global search aggregates community summaries across the entire corpus.
          </p>
        </Reveal>
      </section>

      {/* Error Callout */}
      {errorMsg && (
        <Reveal delay={0}>
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        </Reveal>
      )}

      {/* Query Form floating in pure white card */}
      <Reveal delay={160}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D3D0CA',
            boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
            padding: '36px 32px 32px 32px',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '44px',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Centered Wide Serif Query Input */}
            <div style={{ marginBottom: '28px' }}>
              <input
                type="text"
                className="input-serif-query"
                placeholder="Inquire into the documents..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Suggested Question Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span className="meta-label" style={{ fontSize: '10.5px', color: 'var(--ash-600)' }}>Suggested Queries:</span>
              {[
                'Who invented the World Wide Web?',
                'What technologies were created at CERN?',
                'What are the main research themes in the documents?',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setQuestion(sample)}
                  style={{
                    background: 'var(--bg-soft)',
                    border: '1px solid var(--ash-200)',
                    borderRadius: '2px',
                    padding: '5px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ash-200)';
                    e.currentTarget.style.color = 'var(--ink)';
                  }}
                >
                  "{sample}"
                </button>
              ))}
            </div>

            {/* Mode Selector and Submit Action */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              {/* Segmented Mode Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span className="meta-label">Routing Mode:</span>
                {['auto', 'local', 'global'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: mode === m ? 'var(--ink)' : 'var(--ash-400)',
                      padding: '6px 0',
                      position: 'relative',
                      transition: 'color var(--trans-fast)',
                    }}
                  >
                    <span>{m}</span>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        backgroundColor: 'var(--accent)',
                        transform: mode === m ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 200ms var(--ease-editorial)',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <MagneticButton
                type="submit"
                disabled={loading || !question.trim()}
                className="btn btn-primary"
              >
                <span>{loading ? 'Synthesizing...' : 'Inquire'}</span>
                <ArrowUpRight size={16} strokeWidth={1.25} />
              </MagneticButton>
            </div>
          </form>
        </div>
      </Reveal>

      {/* Loading Thinking State */}
      {loading && (
        <Reveal delay={0}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D3D0CA',
              boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
              padding: '56px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '44px',
            }}
          >
            <Thinking />
            <p style={{ marginTop: '12px', fontSize: '13.5px', color: 'var(--ash-600)' }}>
              Executing sequential Ollama reasoning & graph traversals...
            </p>
          </div>
        </Reveal>
      )}

      {/* Answer & Evidence Display */}
      {result && !loading && (
        <section>
          {/* Answer Card */}
          <Reveal delay={0}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D3D0CA',
                boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
                padding: '36px 32px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '40px',
              }}
            >
              {/* Metadata Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #D3D0CA',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span className="meta-label">
                    Strategy:{' '}
                    <span style={{ color: 'var(--accent)' }}>{result.mode_used}</span>
                  </span>
                  <span className="meta-label">
                    Latency: <span>{result.latency_ms} ms</span>
                  </span>
                </div>

                {/* LangSmith Trace Link */}
                {result.trace_url ? (
                  <a
                    href={result.trace_url}
                    target="_blank"
                    rel="noreferrer"
                    className="editorial-link meta-label"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>View Trace in LangSmith</span>
                    <ExternalLink size={12} strokeWidth={1.25} />
                  </a>
                ) : (
                  <span className="meta-label" style={{ color: 'var(--ash-400)' }}>
                    Tracing Offline
                  </span>
                )}
              </div>

              {/* Answer Text */}
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px',
                  lineHeight: '1.55',
                  color: 'var(--ink)',
                  whiteSpace: 'pre-line',
                  marginBottom: '28px',
                }}
              >
                {result.answer}
              </div>

              {/* Thumbs Feedback */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingTop: '18px',
                  borderTop: '1px dashed #D3D0CA',
                }}
              >
                <span className="meta-label">Was this answer accurate?</span>
                <button
                  type="button"
                  onClick={() => handleFeedback(1)}
                  disabled={feedbackSent !== null}
                  aria-label="Thumbs up"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    color: feedbackSent === 1 ? 'var(--accent)' : 'var(--ash-600)',
                  }}
                >
                  <ThumbsUp size={16} strokeWidth={1.25} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(0)}
                  disabled={feedbackSent !== null}
                  aria-label="Thumbs down"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    color: feedbackSent === 0 ? 'var(--accent)' : 'var(--ash-600)',
                  }}
                >
                  <ThumbsDown size={16} strokeWidth={1.25} />
                </button>
                {feedbackSent !== null && (
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontStyle: 'italic' }}>
                    Feedback recorded
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          {/* Subgraph Visualization */}
          {result.subgraph?.nodes?.length > 0 && (
            <Reveal delay={120}>
              <div style={{ marginBottom: '44px' }}>
                <div className="meta-label" style={{ marginBottom: '14px' }}>
                  Retrieved Subgraph Neighborhood ({result.subgraph.nodes.length} nodes)
                </div>
                <GraphView data={result.subgraph} height={400} />
              </div>
            </Reveal>
          )}

          {/* Supporting Source Passages */}
          {result.sources?.chunks?.length > 0 && (
            <Reveal delay={180}>
              <div>
                <div className="meta-label" style={{ marginBottom: '16px' }}>
                  Supporting Context ({result.sources.chunks.length} passages)
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '24px',
                  }}
                >
                  {result.sources.chunks.map((chunk, idx) => (
                    <SourceCard key={chunk.id || idx} index={idx} chunk={chunk} />
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </section>
      )}
    </div>
  );
}
