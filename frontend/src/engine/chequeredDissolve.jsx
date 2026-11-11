/**
 * Chequered Dissolve Seam component.
 * Executes cellular pseudorandom noise pixel dissolution between blocks
 * using the exact mathematical formulation specified in Section 6.
 */

import React, { useRef, useEffect } from 'react';
import { readToken } from './readToken';
import { useScrollProgress } from './scrollTrigger';

function clamp01(v) {
  return Math.min(Math.max(v, 0), 1);
}

const noise = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

export function ChequeredDissolve({
  carryVar = '--bg',
  accentVar = '--accent',
  zIndex = 10,
  height = '34svh',
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const progress = useScrollProgress(containerRef, { start: 'top_bottom', end: 'top_top' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const heightPx = canvas.parentElement?.clientHeight || window.innerHeight * 0.34;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * ratio;
    canvas.height = heightPx * ratio;
    ctx.scale(ratio, ratio);

    ctx.clearRect(0, 0, width, heightPx);

    const CELL = 24;
    const SOLID_UNTIL = 0.16;
    const LIFT = 2;
    const ACCENT_SHARE = 0.06;

    const surface = readToken(carryVar, '#0F2A1D');
    const accent = readToken(accentVar, '#D8C39A');

    const columns = Math.ceil(width / CELL);
    const rows = Math.ceil(heightPx / CELL);
    const lift = progress * LIFT;

    for (let y = 0; y < rows; y++) {
      const depth = y / Math.max(1, rows - 1) + lift;
      if (depth > 1) break;
      const solid = depth <= SOLID_UNTIL;
      const fade = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL));
      if (!solid && fade <= 0) break;

      for (let x = 0; x < columns; x++) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue;
          if (noise(x, y) > fade) continue;
        }
        ctx.fillStyle = !solid && noise(x + 101, y + 57) < ACCENT_SHARE ? accent : surface;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }, [progress, carryVar, accentVar]);

  return (
    <div
      ref={containerRef}
      className={`chequered-dissolve-seam ${className}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height,
        zIndex,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

export default ChequeredDissolve;

