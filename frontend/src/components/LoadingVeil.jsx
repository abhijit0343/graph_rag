/**
 * Editorial Loading Veil for the Home route.
 * Features a node-link glyph fill meter, rising typography, and a 3-beat physical spring exit sequence.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Spring, SPRING_CONFIGS } from '../engine/spring';
import { ticker } from '../engine/ticker';

export function LoadingVeil({ sceneReady = false, onComplete }) {
  const [visible, setVisible] = useState(true);
  const [meterScale, setMeterScale] = useState(0);
  const [contentOpacity, setContentOpacity] = useState(1);
  const [contentY, setContentY] = useState(0);
  const [veilOpacity, setVeilOpacity] = useState(1);
  const [textY, setTextY] = useState(0.35);
  const [textOpacity, setTextOpacity] = useState(0);

  const veilRef = useRef(null);

  useEffect(() => {
    // 1. Damped springs
    const progressSpring = new Spring({
      initial: 0,
      target: 0.7,
      precision: 0.002,
      ...SPRING_CONFIGS.PROGRESS_WAITING,
    });

    const contentOpacitySpring = new Spring({ initial: 1, target: 1, precision: 0.001, ...SPRING_CONFIGS.CLEAR });
    const contentYSpring = new Spring({ initial: 0, target: 0, precision: 0.005, ...SPRING_CONFIGS.CLEAR });
    const veilOpacitySpring = new Spring({ initial: 1, target: 1, precision: 0.001, ...SPRING_CONFIGS.VEIL });
    const textSpring = new Spring({ initial: 0.35, target: 0, precision: 0.005, ...SPRING_CONFIGS.COPY });

    let readyTime = null;
    let exitTriggered = false;
    let handoverCalled = false;
    const startTime = performance.now();

    const unsubscribe = ticker.subscribe((now) => {
      // Animate "graphrag" text rise at +260ms
      if (now - startTime >= 260) {
        const tY = textSpring.step(16);
        setTextY(tY);
        setTextOpacity(Math.max(0, 1 - tY / 0.35));
      }

      // Step progress toward 0.7 or 1.0 if scene is ready
      if (sceneReady) {
        if (!readyTime) readyTime = now;
        progressSpring.tension = SPRING_CONFIGS.PROGRESS_READY.tension;
        progressSpring.friction = SPRING_CONFIGS.PROGRESS_READY.friction;
        progressSpring.setTarget(1.0);
      }

      const p = progressSpring.step(16);
      setMeterScale(p);

      // Trigger 3-beat exit sequence once scene is ready and progress reaches ~0.99
      if (sceneReady && p >= 0.98 && !exitTriggered) {
        exitTriggered = true;
        // Beat 1: Content clears
        contentOpacitySpring.setTarget(0);
        contentYSpring.setTarget(-0.75); // translateY(-0.75rem)

        // Beat 2: 430 + 240 ms later, veil lifts and page entrance starts
        setTimeout(() => {
          veilOpacitySpring.setTarget(0);
          if (!handoverCalled) {
            handoverCalled = true;
            if (onComplete) onComplete();
          }
        }, 670);
      }

      if (exitTriggered) {
        setContentOpacity(contentOpacitySpring.step(16));
        setContentY(contentYSpring.step(16));
        const vOp = veilOpacitySpring.step(16);
        setVeilOpacity(vOp);

        if (vOp <= 0.004) {
          setVisible(false);
        }
      }
    }, () => 0);

    // 3000ms safety backstop
    const backstop = setTimeout(() => {
      setVisible(false);
      if (!handoverCalled && onComplete) onComplete();
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(backstop);
    };
  }, [sceneReady, onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={veilRef}
      role="status"
      aria-label="Loading local knowledge graph environment"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg)',
        opacity: veilOpacity,
        pointerEvents: sceneReady ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Centered Masked Glyph & Brand */}
      <div
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${contentY}rem, 0)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Node-Link Glyph Box (7.2rem x 8.5rem) */}
        <div
          style={{
            width: '7.2rem',
            height: '8.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Faint Shell (12% opacity) */}
          <svg
            viewBox="0 0 115 136"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              fill: 'none',
              stroke: 'var(--ink)',
              strokeWidth: 2,
              opacity: 0.12,
            }}
          >
            <circle cx="57" cy="68" r="14" />
            <circle cx="20" cy="28" r="8" />
            <circle cx="95" cy="34" r="7" />
            <circle cx="24" cy="112" r="7" />
            <circle cx="92" cy="108" r="8" />
            <line x1="57" y1="68" x2="20" y2="28" />
            <line x1="57" y1="68" x2="95" y2="34" />
            <line x1="57" y1="68" x2="24" y2="112" />
            <line x1="57" y1="68" x2="92" y2="108" />
          </svg>

          {/* Solid Filling Sheet */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'top',
              transform: `scaleY(${meterScale})`,
              backgroundColor: 'transparent',
              overflow: 'hidden',
            }}
          >
            <svg
              viewBox="0 0 115 136"
              style={{
                width: '100%',
                height: '8.5rem',
                fill: 'none',
                stroke: 'var(--ink)',
                strokeWidth: 2.5,
              }}
            >
              <circle cx="57" cy="68" r="14" fill="var(--ink)" />
              <circle cx="20" cy="28" r="8" fill="var(--ink)" />
              <circle cx="95" cy="34" r="7" fill="var(--ink)" />
              <circle cx="24" cy="112" r="7" fill="var(--ink)" />
              <circle cx="92" cy="108" r="8" fill="var(--ink)" />
              <line x1="57" y1="68" x2="20" y2="28" />
              <line x1="57" y1="68" x2="95" y2="34" />
              <line x1="57" y1="68" x2="24" y2="112" />
              <line x1="57" y1="68" x2="92" y2="108" />
            </svg>
          </div>
        </div>

        {/* Rising "graphrag" Text */}
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--ink)',
            opacity: textOpacity,
            transform: `translate3d(0, ${textY}rem, 0)`,
          }}
        >
          graphrag
        </div>
      </div>

      {/* 4px Foot Progress Meter */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'var(--ash-200)',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--ink)',
            transformOrigin: 'left',
            transform: `scaleX(${meterScale})`,
            transition: 'transform 80ms linear',
          }}
        />
      </div>
    </div>
  );
}

export default LoadingVeil;

