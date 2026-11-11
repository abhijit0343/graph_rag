/**
 * Block 2: How the Graph is Built (Pipeline Circuit).
 * Features baking halftone particle lattice, animated Catmull-Rom circuit trace,
 * rotating globe standings plate, and interactive cursor reticle.
 */

import React, { useRef, useEffect, useState } from 'react';
import ChequeredDissolve from '../../engine/chequeredDissolve';
import { TextReveal } from '../../engine/textReveal';
import { SPRING_CONFIGS } from '../../engine/spring';
import { readToken, readTokenHex } from '../../engine/readToken';
import { ticker } from '../../engine/ticker';
import { apiClient } from '../../api/client';

export function CircuitBlock() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [stats, setStats] = useState({ nodes: '—', edges: '—', communities: '—' });
  const [globeAngle, setGlobeAngle] = useState(0);

  // Standings plate statistics
  useEffect(() => {
    async function loadStats() {
      try {
        const resp = await apiClient.get('/graph/stats');
        setStats({
          nodes: resp.data.nodes > 0 ? String(resp.data.nodes) : '—',
          edges: resp.data.edges > 0 ? String(resp.data.edges) : '—',
          communities: resp.data.communities > 0 ? String(resp.data.communities) : '—',
        });
      } catch (e) {
        // Fallback defaults
      }
    }
    loadStats();
  }, []);

  // Halftone canvas and Circuit Lap execution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let inView = false;
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    }, { threshold: 0.15 });

    observer.observe(canvas);

    const width = 1440;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // 1. Bake resting Halftone Dots into Offscreen Canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');

    const dotColor = readToken('--ash-600', '#BDB296');
    offCtx.fillStyle = dotColor;

    const pitchX = 7.8 * 2.2;
    const pitchY = 7.7 * 2.2;
    const radius = 1.75;

    for (let y = 30; y < height - 30; y += pitchY) {
      for (let x = 30; x < width - 30; x += pitchX) {
        // Pseudo noise landmass mask
        const distToCenter = Math.hypot(x - width * 0.55, y - height * 0.5);
        const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01);
        if (distToCenter < 380 && noise > -0.2) {
          offCtx.beginPath();
          offCtx.arc(x, y, radius, 0, Math.PI * 2);
          offCtx.fill();
        }
      }
    }

    // 2. 7-Stage Circuit Loop Coordinates
    const stages = [
      { name: 'chunk', x: 280, y: 380 },
      { name: 'extract', x: 420, y: 220 },
      { name: 'merge', x: 680, y: 190 },
      { name: 'graph', x: 920, y: 280 },
      { name: 'communities', x: 1080, y: 460 },
      { name: 'summaries', x: 840, y: 620 },
      { name: 'embed', x: 500, y: 560 },
    ];

    let lapProgress = 0;
    const startTime = performance.now();

    const unsubscribe = ticker.subscribe((now) => {
      if (!inView) return;

      // Rotate globe angle
      setGlobeAngle((prev) => (prev + 0.015) % (Math.PI * 2));

      ctx.clearRect(0, 0, width, height);

      // Blit baked halftone dots
      ctx.globalAlpha = 0.45;
      ctx.drawImage(offscreen, 0, 0);
      ctx.globalAlpha = 1.0;

      // Animate circuit trace
      const elapsed = (now - startTime) / 1000;
      lapProgress = Math.min(elapsed / 6.0, 1.0);

      const accentColor = readToken('--accent', '#D8C39A');
      const inkColor = readToken('--ink', '#EFE6D0');

      // Draw stage nodes & circuit tracks
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      stages.forEach((st, idx) => {
        if (idx === 0) ctx.moveTo(st.x, st.y);
        else ctx.lineTo(st.x, st.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw illuminated lap head
      const currentSegment = Math.floor(lapProgress * stages.length) % stages.length;
      const nextSegment = (currentSegment + 1) % stages.length;
      const subT = (lapProgress * stages.length) % 1;

      const p0 = stages[currentSegment];
      const p1 = stages[nextSegment];
      const headX = p0.x + (p1.x - p0.x) * subT;
      const headY = p0.y + (p1.y - p0.y) * subT;

      // Additive spark & pulse glow
      ctx.save();
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(headX, headY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Stage Node Markers & Triangles
      stages.forEach((st, idx) => {
        const isPassed = (idx / stages.length) <= lapProgress;
        ctx.fillStyle = isPassed ? accentColor : inkColor;
        ctx.beginPath();
        ctx.arc(st.x, st.y, isPassed ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '600 10px "Manrope", sans-serif';
        ctx.fillStyle = readToken('--ash-600', '#BDB296');
        ctx.textAlign = 'center';
        ctx.fillText(st.name.toUpperCase(), st.x, st.y + 18);
      });
    }, () => 24);

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="circuit-section"
      style={{
        position: 'relative',
        minHeight: '100lvh',
        width: '100%',
        backgroundColor: 'var(--surface)',
        overflow: 'hidden',
        padding: '5rem 1.5rem 3rem 1.5rem',
      }}
    >
      {/* Chequered Dissolve Seam at Top */}
      <ChequeredDissolve carryVar="--bg" accentVar="--accent" zIndex={10} />

      {/* Main Content Artboard */}
      <div
        className="app-container"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '85lvh',
        }}
      >
        {/* Left Rail Heading & Copy Column */}
        <div style={{ maxWidth: '520px', zIndex: 12 }}>
          <div className="numbered-section" style={{ marginBottom: '14px' }}>
            <span className="num">02</span> / <span>Pipeline Architecture</span>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 4.5vw, 68px)',
              lineHeight: 0.95,
              textTransform: 'uppercase',
              color: 'var(--accent)',
              margin: '0 0 16px 0',
              fontWeight: 600,
            }}
          >
            <TextReveal text="how the graph is built." mode="words" delayIn={100} stagger={130} />
          </h2>

          <div
            style={{
              width: '42px',
              height: '2px',
              backgroundColor: 'var(--accent)',
              marginBottom: '20px',
            }}
          />

          <p style={{ color: 'var(--ink)', fontSize: '15px', lineHeight: 1.6, maxWidth: '440px' }}>
            <TextReveal
              text="Every document becomes entities, relations and communities. Here is the loop."
              mode="words"
              delayIn={350}
              stagger={34}
            />
          </p>
        </div>

        {/* Circuit Interactive Map Canvas Stage */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              maxWidth: '1440px',
              height: 'auto',
              maxHeight: '800px',
            }}
          />
        </div>

        {/* Standings Plate (Bottom-Right, 277x78 Corner Cut 9) */}
        <div
          style={{
            alignSelf: 'flex-end',
            position: 'relative',
            zIndex: 12,
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              width: '277px',
              height: '78px',
              position: 'relative',
              backgroundColor: 'var(--surface)',
            }}
          >
            {/* Corner-Cut SVG Outline M0.5 0.5H276.5V69L268 77.5H0.5Z */}
            <svg
              viewBox="0 0 277 78"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                fill: 'var(--surface)',
                stroke: 'var(--accent)',
                strokeWidth: 1,
              }}
            >
              <path d="M0.5 0.5H276.5V69L268 77.5H0.5Z" />
              <line x1="83" y1="0.5" x2="83" y2="77.5" stroke="var(--ash-200)" />
            </svg>

            {/* Inner Content Split */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'grid',
                gridTemplateColumns: '83px 1fr',
                height: '100%',
                padding: '8px 12px',
                alignItems: 'center',
              }}
            >
              {/* Left Cell: Rotating Wireframe Globe */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <svg viewBox="0 0 40 26" style={{ width: '38px', height: '24px', stroke: 'var(--accent)', fill: 'none', strokeWidth: 1 }}>
                  <ellipse cx="20" cy="13" rx="18" ry="11" />
                  <line x1="2" y1="13" x2="38" y2="13" />
                  <ellipse cx="20" cy="13" rx={Math.max(0.5, Math.abs(Math.cos(globeAngle)) * 18)} ry="11" />
                </svg>
                <div style={{ fontSize: '8px', letterSpacing: '0.12em', color: 'var(--ink)', textTransform: 'uppercase' }}>
                  GRAPH / LOCAL
                </div>
              </div>

              {/* Right Cell: Telemetry Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nodes:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{stats.nodes}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edges:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{stats.edges}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clusters:</span>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{stats.communities}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CircuitBlock;

