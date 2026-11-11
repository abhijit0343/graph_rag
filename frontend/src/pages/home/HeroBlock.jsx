/**
 * Block 1: Hero Block.
 * Features full WebGL Three.js interactive canvas, monumental Cormorant headline,
 * bracket telemetry panels, Chamfered SVG CTA button, and responsive mobile nav sheet.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroScene } from './HeroScene';
import { TextReveal } from '../../engine/textReveal';
import { SPRING_CONFIGS } from '../../engine/spring';
import { apiClient } from '../../api/client';
import MagneticButton from '../../components/MagneticButton';
import { Cpu, Database, Activity, ArrowRight } from 'lucide-react';

export function HeroBlock({ onSceneReady, entranceReady = false }) {
  const [stats, setStats] = useState({ nodes: '—', edges: '—', communities: '—', chunks: '—' });

  // Fetch telemetry figures
  useEffect(() => {
    async function loadStats() {
      try {
        const [gResp, iResp] = await Promise.allSettled([
          apiClient.get('/graph/stats'),
          apiClient.get('/index/status'),
        ]);

        const gData = gResp.status === 'fulfilled' ? gResp.value.data : {};
        const iData = iResp.status === 'fulfilled' ? iResp.value.data : {};

        setStats({
          nodes: gData.nodes > 0 ? String(gData.nodes) : '—',
          edges: gData.edges > 0 ? String(gData.edges) : '—',
          communities: gData.communities > 0 ? String(gData.communities) : '—',
          chunks: iData.counts?.chunks > 0 ? String(iData.counts.chunks) : '—',
        });
      } catch (e) {
        // Fallback defaults to em dash
      }
    }
    loadStats();
  }, []);

  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        minHeight: '100lvh',
        width: '100%',
        backgroundColor: 'var(--bg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background WebGL Scene */}
      <HeroScene onReady={onSceneReady} riseTriggered={entranceReady} />

      {/* Main Content Column */}
      <div
        className="app-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Middle Content Row: Identity Left & Bracket Telemetry Panels Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: '40px',
            alignItems: 'center',
            margin: 'auto 0',
          }}
        >
          {/* Identity Left */}
          <div style={{ maxWidth: '820px' }}>
            <div className="numbered-section" style={{ marginBottom: '14px' }}>
              <span className="num">01</span> / <span>Local GraphRAG</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(54px, 8.8vw, 150px)',
                lineHeight: 0.92,
                letterSpacing: '-0.035em',
                color: 'var(--ink)',
                fontWeight: 500,
                margin: '0 0 28px 0',
              }}
            >
              <TextReveal
                text="Turn documents into knowledge."
                mode="words"
                accentWord="documents"
                accentStyle={{ color: 'var(--accent)', fontStyle: 'italic' }}
                delayIn={180}
                stagger={110}
                config={SPRING_CONFIGS.REVEAL}
              />
            </h1>

            {/* Three Meta Subrows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: Cpu, label: 'Llama 3.2, running locally (temperature 0)' },
                { icon: Database, label: 'nomic-embed-text local embeddings' },
                { icon: Activity, label: 'Traced with LangSmith instrumentation' },
              ].map((row, idx) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: 'var(--ash-600)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <Icon size={14} strokeWidth={1.25} color="var(--accent)" />
                    <span>{row.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bracket Telemetry Panels Right (13.625rem column) */}
          <div
            className="bracket-panels-column"
            style={{
              width: '13.625rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Panel 1: Index Status */}
            <div
              style={{
                position: 'relative',
                padding: '16px',
                backgroundColor: 'transparent',
              }}
            >
              {/* Four Corner 10x10 Brackets */}
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(270 5 5)" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(90 5 5)" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(180 5 5)" /></svg>

              <div className="meta-label" style={{ marginBottom: '10px', color: 'var(--accent)' }}>Index Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ash-600)' }}>Chunks:</span>
                  <span style={{ fontWeight: 600 }}>{stats.chunks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ash-600)' }}>Entities:</span>
                  <span style={{ fontWeight: 600 }}>{stats.nodes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ash-600)' }}>Communities:</span>
                  <span style={{ fontWeight: 600 }}>{stats.communities}</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Stack Telemetry */}
            <div
              style={{
                position: 'relative',
                padding: '16px',
                backgroundColor: 'transparent',
              }}
            >
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(270 5 5)" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(90 5 5)" /></svg>
              <svg viewBox="0 0 10 10" style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, fill: 'none', stroke: 'var(--ash-200)', strokeWidth: 1 }}><path d="M0 0.5H10V10.5" transform="rotate(180 5 5)" /></svg>

              <div className="meta-label" style={{ marginBottom: '10px' }}>Active Stack</div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ash-600)', marginBottom: '10px' }}>
                Ollama • FAISS • NetworkX • FastAPI
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--accent)' }}>{stats.nodes}</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--ash-600)' }}>Nodes</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>{stats.edges}</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--ash-600)' }}>Edges</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)' }}>{stats.communities}</div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--ash-600)' }}>Clusters</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Foot Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid var(--ash-200)',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Chamfered SVG CTA Button (220x50) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link
              to="/index"
              className="chamfer-cta"
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '220px',
                height: '50px',
                textDecoration: 'none',
              }}
            >
              <svg
                viewBox="0 0 220 50"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              >
                <path d="M220 42L212.932 50H0V0H220V42Z" fill="var(--panel-bg)" stroke="var(--accent)" strokeWidth="1" />
              </svg>
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ink)',
                }}
              >
                <span>Begin Indexing</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link to="/ask" className="editorial-link meta-label">
              Ask a question &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/graph" className="editorial-link meta-label">Explorer</Link>
            <Link to="/eval" className="editorial-link meta-label">Evaluation</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBlock;

