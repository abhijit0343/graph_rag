/**
 * 2D Marching Squares Contour Canvas.
 * Generates continuous topological elevation curves from an analytic trigonometric field.
 * Redrawn via ticker loop at ~24ms intervals while visible.
 */

import React, { useRef, useEffect } from 'react';
import { ticker } from './ticker';
import { readToken } from './readToken';

const LINE_SCALE = 3.8;
const LINE_COUNT = 2.5;
const WAVE_AMOUNT = 0.37;
const WAVE_SPEED = 1.66;
const CELLS = 96;

const field = (x, y, t) => {
  let f = Math.sin(x + t * 0.6) * 0.5;
  f += Math.sin(y * 0.85 - t * 0.45) * 0.45;
  f += Math.sin((x + y) * 0.65 + t * 0.35) * 0.35;
  f += Math.sin((x - y) * 0.95 - t * 0.55) * 0.25;
  return f * 0.5 + 0.5;
};

export function ContourCanvas({
  strokeVar = '--ash-200',
  opacity = 0.85,
  className = '',
  style = {},
}) {
  const canvasRef = useRef(null);
  const inViewRef = useRef(true);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    }, { rootMargin: '10% 0px 10% 0px' });

    observer.observe(canvas);

    const unsubscribe = ticker.subscribe((now) => {
      if (!inViewRef.current) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }

      ctx.save();
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);

      const strokeColor = readToken(strokeVar, 'rgba(239, 230, 208, 0.16)');
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = opacity;

      const t = ((now - startTimeRef.current) / 1000) * WAVE_SPEED;
      const aspect = width / Math.max(height, 1);

      const cols = CELLS;
      const rows = Math.max(Math.round(CELLS / aspect), 24);
      const cellW = width / cols;
      const cellH = height / rows;

      // Sample grid values
      const grid = new Float32Array((cols + 1) * (rows + 1));
      for (let j = 0; j <= rows; j++) {
        const ny = ((j / rows) * 2 - 1) * LINE_SCALE;
        for (let i = 0; i <= cols; i++) {
          const nx = ((i / cols) * 2 - 1) * aspect * LINE_SCALE;
          const qx = nx + Math.sin(ny * 0.8 + t * 0.7) * WAVE_AMOUNT;
          const qy = ny + Math.cos(nx * 0.7 - t * 0.6) * WAVE_AMOUNT;
          grid[j * (cols + 1) + i] = field(qx, qy, t) * LINE_COUNT;
        }
      }

      // Marching squares over iso-levels
      const levels = [0.5, 1.5];
      ctx.beginPath();

      for (const level of levels) {
        for (let j = 0; j < rows; j++) {
          const y0 = j * cellH;
          const y1 = y0 + cellH;
          const rowIdx0 = j * (cols + 1);
          const rowIdx1 = (j + 1) * (cols + 1);

          for (let i = 0; i < cols; i++) {
            const x0 = i * cellW;
            const x1 = x0 + cellW;

            const a = grid[rowIdx0 + i];
            const b = grid[rowIdx0 + i + 1];
            const c = grid[rowIdx1 + i + 1];
            const d = grid[rowIdx1 + i];

            const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
            if (idx === 0 || idx === 15) continue;

            const interp = (v1, v2) => Math.max(0, Math.min(1, (level - v1) / (v2 - v1 || 1e-5)));

            const topP = [x0 + cellW * interp(a, b), y0];
            const rightP = [x1, y0 + cellH * interp(b, c)];
            const bottomP = [x0 + cellW * interp(d, c), y1];
            const leftP = [x0, y0 + cellH * interp(a, d)];

            switch (idx) {
              case 1:
              case 14:
                ctx.moveTo(leftP[0], leftP[1]); ctx.lineTo(bottomP[0], bottomP[1]); break;
              case 2:
              case 13:
                ctx.moveTo(bottomP[0], bottomP[1]); ctx.lineTo(rightP[0], rightP[1]); break;
              case 3:
              case 12:
                ctx.moveTo(leftP[0], leftP[1]); ctx.lineTo(rightP[0], rightP[1]); break;
              case 4:
              case 11:
                ctx.moveTo(topP[0], topP[1]); ctx.lineTo(rightP[0], rightP[1]); break;
              case 6:
              case 9:
                ctx.moveTo(topP[0], topP[1]); ctx.lineTo(bottomP[0], bottomP[1]); break;
              case 7:
              case 8:
                ctx.moveTo(leftP[0], leftP[1]); ctx.lineTo(topP[0], topP[1]); break;
              case 5:
                ctx.moveTo(leftP[0], leftP[1]); ctx.lineTo(topP[0], topP[1]);
                ctx.moveTo(bottomP[0], bottomP[1]); ctx.lineTo(rightP[0], rightP[1]); break;
              case 10:
                ctx.moveTo(leftP[0], leftP[1]); ctx.lineTo(bottomP[0], bottomP[1]);
                ctx.moveTo(topP[0], topP[1]); ctx.lineTo(rightP[0], rightP[1]); break;
              default:
                break;
            }
          }
        }
      }

      ctx.stroke();
      ctx.restore();
    }, () => 24); // 24ms throttle

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [strokeVar, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`contour-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default ContourCanvas;

