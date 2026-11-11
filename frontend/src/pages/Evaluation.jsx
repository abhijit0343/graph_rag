/**
 * Page 04 / Evaluation
 * Comparative benchmark between Baseline Vector RAG and GraphRAG.
 * Features hairline evaluation table, winning score highlighting in --accent,
 * and external links to LangSmith experiment runs floating in pure white panels.
 */

import React, { useState, useEffect } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';
import Reveal from '../components/Reveal';
import MagneticButton from '../components/MagneticButton';
import ErrorBanner from '../components/ErrorBanner';
import { Thinking } from '../components/Spinner';

export default function Evaluation() {
  const [evalData, setEvalData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load benchmark questions on initial load
  useEffect(() => {
    async function loadQuestions() {
      try {
        const resp = await apiClient.get('/evaluate/questions');
        setQuestions(resp.data);
      } catch (err) {
        // Non-blocking
      }
    }
    loadQuestions();
  }, []);

  const handleRunEvaluation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resp = await apiClient.post('/evaluate');
      setEvalData(resp.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scores = evalData?.scores;

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <section style={{ marginBottom: '36px' }}>
        <Reveal delay={0}>
          <div className="numbered-section">
            <span className="num">04</span> / <span>Comparative Benchmarks</span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h1 style={{ fontSize: '42px', marginBottom: '8px' }}>RAG Architecture Evaluation</h1>
        </Reveal>
        <Reveal delay={120}>
          <p style={{ color: 'var(--ash-600)', fontSize: '15.5px' }}>
            Empirical evaluation comparing traditional Vector-Only RAG against Knowledge Graph Augmented Retrieval using local LLM judges (groundedness and correctness) plus deterministic context hits.
          </p>
        </Reveal>
      </section>

      {/* Error Callout */}
      {errorMsg && (
        <Reveal delay={0}>
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        </Reveal>
      )}

      {/* Floating Control Bar */}
      <Reveal delay={160}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D3D0CA',
            boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
            borderRadius: 'var(--radius-xs)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          <MagneticButton
            onClick={handleRunEvaluation}
            disabled={loading}
            className="btn btn-primary"
          >
            <span>{loading ? 'Evaluating...' : 'Run Benchmark Suite'}</span>
            <Play size={15} strokeWidth={1.25} />
          </MagneticButton>

          {/* LangSmith Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {evalData?.graphrag_url && (
              <a
                href={evalData.graphrag_url}
                target="_blank"
                rel="noreferrer"
                className="editorial-link meta-label"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <span>View Experiments in LangSmith</span>
                <ExternalLink size={12} strokeWidth={1.25} />
              </a>
            )}
          </div>
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
              marginBottom: '36px',
            }}
          >
            <Thinking />
            <p style={{ marginTop: '12px', fontSize: '13.5px', color: 'var(--ash-600)' }}>
              Executing local Ollama evaluations across both architectures...
            </p>
          </div>
        </Reveal>
      )}

      {/* Score Comparison Table floating in pure white panel */}
      {scores && !loading && (
        <Reveal delay={200}>
          <section style={{ marginBottom: '44px' }}>
            <div className="meta-label" style={{ marginBottom: '14px' }}>
              Aggregate Results ({scores.graphrag.samples_evaluated} Questions)
            </div>

            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D3D0CA',
                boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
              }}
            >
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>Metric Evaluated</th>
                    <th>Baseline Vector RAG</th>
                    <th>GraphRAG (Hybrid)</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      key: 'groundedness',
                      name: 'Groundedness (LLM Judge)',
                      desc: 'Absence of hallucinations relative to retrieved context',
                    },
                    {
                      key: 'correctness',
                      name: 'Semantic Correctness (LLM Judge)',
                      desc: 'Accuracy relative to curated ground-truth reference',
                    },
                    {
                      key: 'context_hit',
                      name: 'Context Hit Ratio (Deterministic)',
                      desc: 'Recall of essential query terms in retrieved documents',
                    },
                  ].map((row) => {
                    const baseVal = scores.baseline[row.key];
                    const gragVal = scores.graphrag[row.key];
                    const gragWins = gragVal >= baseVal;
                    const diff = (gragVal - baseVal).toFixed(3);

                    return (
                      <tr key={row.key}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{row.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--ash-600)' }}>{row.desc}</div>
                        </td>
                        <td
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            color: !gragWins ? 'var(--accent)' : 'var(--ink)',
                            fontWeight: !gragWins ? 600 : 400,
                          }}
                        >
                          {(baseVal * 100).toFixed(1)}%
                        </td>
                        <td
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '16px',
                            color: gragWins ? 'var(--accent)' : 'var(--ink)',
                            fontWeight: gragWins ? 600 : 400,
                          }}
                        >
                          {(gragVal * 100).toFixed(1)}%
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: Number(diff) >= 0 ? 'var(--accent)' : 'var(--ash-600)',
                            }}
                          >
                            {Number(diff) > 0 ? `+${(Number(diff) * 100).toFixed(1)}%` : `${(Number(diff) * 100).toFixed(1)}%`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      )}

      {/* Benchmark Questions Table floating in pure white panel */}
      <Reveal delay={240}>
        <section>
          <div className="meta-label" style={{ marginBottom: '14px' }}>
            Benchmark Dataset Questions (eval_questions.json)
          </div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D3D0CA',
              boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
            }}
          >
            <table className="editorial-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '90px' }}>Type</th>
                  <th>Question & Expected Ground Truth</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ash-600)' }}>
                      {q.id}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          fontSize: '10px',
                          color: q.type === 'global' ? 'var(--accent)' : 'var(--ink)',
                        }}
                      >
                        {q.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, marginBottom: '4px' }}>{q.question}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ash-600)', fontStyle: 'italic' }}>
                        Ref: {q.ground_truth}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
