/**
 * Block 5: Sign-Off (Final Layer)
 * Ground: var(--accent) with inset panel (var(--surface)) holding ContourCanvas.
 * Wireframe node-link figure hanging off foot on scrubbed parallax,
 * masthead "start / building.", navigation links with letter reveals,
 * wordmark, and foot row with hollow chamfered CTA.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useScrollTrigger, interpolateProgress } from '../../engine/scrollTrigger';
import { subscribeTicker } from '../../engine/ticker';
import ContourCanvas from '../../engine/contourCanvas';
import { TextRevealWords, TextRevealLetters } from '../../engine/textReveal';

const NAV_ITEMS = [
  { label: 'Upload', path: '/index' },
  { label: 'Ask', path: '/ask' },
  { label: 'Graph', path: '/graph' },
  { label: 'Evaluation', path: '/eval' },
  { label: 'Home', path: '/' }
];

export default function SignoffBlock() {
  const blockRef = useRef(null);
  const canvasRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [blockProgress, setBlockProgress] = useState(0);

  // Parallax layer scrubbed "top bottom" -> "bottom bottom" moving top from 60px to 0cqw
  useScrollTrigger(blockRef, {
    start: "top bottom",
    end: "bottom bottom",
    onUpdate: (prog) => {
      setBlockProgress(prog);
      if (prog > 0.05 && !inView) {
        setInView(true);
      }
    }
  });

  const figureTopOffset = interpolateProgress(blockProgress, 60, 0);

  // Wireframe node-link figure standing off foot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = 650);
    let height = (canvas.height = 450);

    // Seeded nodes
    const nodes = [
      { x: 120, y: 150, r: 4, accent: false },
      { x: 220, y: 100, r: 5, accent: true },
      { x: 340, y: 180, r: 6, accent: false },
      { x: 450, y: 120, r: 5, accent: false },
      { x: 550, y: 220, r: 7, accent: true },
      { x: 280, y: 280, r: 4, accent: false },
      { x: 180, y: 340, r: 5, accent: false },
      { x: 420, y: 320, r: 6, accent: false },
      { x: 500, y: 380, r: 4, accent: false },
      { x: 80,  y: 260, r: 4, accent: false },
      { x: 380, y: 220, r: 5, accent: true },
    ];

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 9], [9, 0],
      [2, 7], [7, 8], [4, 8], [5, 10], [10, 7], [1, 10], [3, 10]
    ];

    let t = 0;
    const unsub = subscribeTicker(() => {
      t += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Render wireframe edges
      ctx.lineWidth = 1;
      edges.forEach(([i, j]) => {
        const n1 = nodes[i];
        const n2 = nodes[j];
        ctx.strokeStyle = 'rgba(239, 230, 208, 0.12)';
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });

      // Render nodes with subtle gentle sway
      nodes.forEach((n, i) => {
        const swayX = Math.sin(t + i) * 3;
        const swayY = Math.cos(t * 0.8 + i) * 3;
        ctx.beginPath();
        ctx.arc(n.x + swayX, n.y + swayY, n.r, 0, Math.PI * 2);
        if (n.accent) {
          ctx.fillStyle = '#D8C39A';
          ctx.fill();
        } else {
          ctx.fillStyle = '#0F2A1D';
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 230, 208, 0.35)';
          ctx.stroke();
        }
      });
    }, () => 1000 / 30);

    return unsub;
  }, []);

  return (
    <section 
      ref={blockRef}
      className="signoff-block-section"
      style={{
        position: 'relative',
        backgroundColor: 'var(--accent)',
        minHeight: '100lvh',
        width: '100%',
        padding: '1.1111cqw',
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: 'var(--ink)'
      }}
    >
      {/* Inset Panel on Every Side (var(--surface), overflow hidden) */}
      <div 
        className="signoff-inset-panel"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100lvh - 2.2222cqw)',
          backgroundColor: 'var(--surface)',
          overflow: 'hidden',
          border: '1px solid rgba(239, 230, 208, 0.16)'
        }}
      >
        {/* Contour Canvas at about 10% opacity */}
        <div style={{ opacity: 0.12, position: 'absolute', inset: 0 }}>
          <ContourCanvas strokeColor="var(--ash-200)" globalAlpha={0.85} />
        </div>

        {/* Wordmark Top-Left: "graphrag" in serif + "local edition" (fading at 120ms) */}
        <div 
          className="signoff-wordmark"
          style={{
            position: 'absolute',
            top: '3.5cqw',
            left: '2.2222cqw',
            zIndex: 25,
            opacity: inView ? 1 : 0,
            transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 120ms'
          }}
        >
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            graphrag
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)', textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: '12px' }}>
            local edition
          </span>
        </div>

        {/* Masthead Top-Right: "start / building." (width 25.6944cqw, 3.8194cqw serif) */}
        <div 
          className="signoff-masthead"
          style={{
            position: 'absolute',
            top: '3.5cqw',
            right: '2.2222cqw',
            width: '25.6944cqw',
            textAlign: 'right',
            zIndex: 25
          }}
        >
          <h2 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '3.8194cqw',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--accent)',
              lineHeight: 0.95,
              margin: 0
            }}
          >
            {inView ? <TextRevealWords text="start / building." stagger={130} /> : "START / BUILDING."}
          </h2>
        </div>

        {/* Nav Column at Left: Vertically Centred */}
        <div 
          className="signoff-nav-column"
          style={{
            position: 'absolute',
            left: '2.2222cqw',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '12cqw',
            minWidth: '220px',
            zIndex: 25,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {NAV_ITEMS.map((item, nIdx) => (
            <Link
              key={item.label}
              to={item.path}
              className="signoff-nav-link"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '34px',
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: 'var(--ink)',
                lineHeight: 1.1,
                transition: 'color 200ms ease, transform 200ms ease',
                display: 'inline-block'
              }}
            >
              {inView ? (
                <TextRevealLetters 
                  text={item.label} 
                  stagger={22} 
                  delayIn={260 + nIdx * 80} 
                  configName="ROW" 
                />
              ) : (
                item.label
              )}
            </Link>
          ))}
        </div>

        {/* Foot Row (32px above the foot) */}
        <div 
          className="signoff-foot-row"
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '2.2222cqw',
            right: '2.2222cqw',
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          {/* Copyright: Muted, 14px, uppercase */}
          <div 
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ash-600)',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(0.75rem)',
              transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 640ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 640ms'
            }}
          >
            (c) 2026 Local GraphRAG. Runs entirely on your machine.
          </div>

          {/* Hollow CTA: "begin indexing" -> /index (275x50, chamfer 8.835) */}
          <Link 
            to="/index"
            className="cta-chamfered-btn"
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '275px',
              height: '50px',
              textDecoration: 'none',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(0.75rem)',
              transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 720ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 720ms'
            }}
          >
            <svg 
              viewBox="0 0 275 50" 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <path 
                d="M0.5 0.5H274.5V41.165L266.165 49.5H0.5Z" 
                fill="none" 
                stroke="var(--accent)" 
                strokeWidth="1.2"
              />
            </svg>
            <span 
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                height: '100%',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink)'
              }}
            >
              begin indexing
              <ArrowRight size={15} color="var(--accent)" />
            </span>
          </Link>

          {/* Right-aligned external documentation links */}
          <div 
            style={{
              display: 'flex',
              gap: '20px',
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(0.75rem)',
              transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 800ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 800ms'
            }}
          >
            <a 
              href="https://ollama.com" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ash-600)', textDecoration: 'none' }}
            >
              ollama
            </a>
            <a 
              href="https://smith.langchain.com" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ash-600)', textDecoration: 'none' }}
            >
              langsmith
            </a>
            <a 
              href="https://microsoft.github.io/graphrag" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ash-600)', textDecoration: 'none' }}
            >
              graphrag docs
            </a>
          </div>
        </div>
      </div>

      {/* Wireframe Node-Link Canvas on Parallax Layer (stands off foot, on section) */}
      <div 
        className="signoff-wireframe-figure"
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '5cqw',
          top: `${figureTopOffset}px`,
          pointerEvents: 'none',
          zIndex: 15,
          transformOrigin: 'bottom'
        }}
      >
        <canvas ref={canvasRef} style={{ width: '650px', height: '450px' }} />
      </div>
    </section>
  );
}

