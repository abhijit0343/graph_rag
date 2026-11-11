/**
 * Editorial signature cursor follower.
 * Uses requestAnimationFrame with lerp smoothing (~0.18) and handles dynamic hover states.
 * Also synchronizes --mx and --my root CSS variables for ambient background radial lighting.
 */

import React, { useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';
import '../styles/cursor.css';

export default function Cursor() {
  const { position, cursorState, isVisible, isOnDark } = useMousePosition();
  const cursorRef = useRef(null);
  const posRef = useRef({ currentX: -100, currentY: -100, targetX: -100, targetY: -100 });
  const animFrameId = useRef(null);

  useEffect(() => {
    posRef.current.targetX = position.x;
    posRef.current.targetY = position.y;

    // Update root CSS variables for mouse-following ambient dark-red radial glow
    if (position.x >= 0 && position.y >= 0) {
      document.documentElement.style.setProperty('--mx', `${position.x}px`);
      document.documentElement.style.setProperty('--my', `${position.y}px`);
    }
  }, [position.x, position.y]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerpFactor = prefersReducedMotion ? 1.0 : 0.18;

    const render = () => {
      const { targetX, targetY } = posRef.current;
      posRef.current.currentX += (targetX - posRef.current.currentX) * lerpFactor;
      posRef.current.currentY += (targetY - posRef.current.currentY) * lerpFactor;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.currentX}px, ${posRef.current.currentY}px, 0)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  const stateClass = `cursor-state-${cursorState}`;
  const darkClass = isOnDark ? 'cursor-on-dark' : '';
  const hiddenClass = !isVisible ? 'cursor-hidden' : '';

  return (
    <div
      ref={cursorRef}
      className={`editorial-cursor-follower ${stateClass} ${darkClass} ${hiddenClass}`}
      aria-hidden="true"
    />
  );
}
