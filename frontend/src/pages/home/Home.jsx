/**
 * Home Route Component ("/")
 * Premium, art-directed, motion-led scroll site across a 5-block stack.
 * Blocks 1–3 form a sticky recede stack with #0A0A0A shading.
 * Blocks 4 & 5 follow in normal page flow.
 * Governed by LoadingVeil, ticker-driven Lenis, and hand-written spring solver.
 */

import React, { useRef, useState, useEffect } from 'react';
import HeroBlock from './HeroBlock';
import CircuitBlock from './CircuitBlock';
import TimelineBlock from './TimelineBlock';
import QueryBlock from './QueryBlock';
import SignoffBlock from './SignoffBlock';
import LoadingVeil from '../../components/LoadingVeil';
import { useStickyStack } from '../../engine/useStickyStack';

export default function Home() {
  const [sceneReady, setSceneReady] = useState(false);
  const [entranceReady, setEntranceReady] = useState(false);

  // References for sticky stack recede
  const b1InnerRef = useRef(null);
  const b1ShadeRef = useRef(null);
  const b2Ref = useRef(null);
  const b2InnerRef = useRef(null);
  const b2ShadeRef = useRef(null);
  const b3Ref = useRef(null);
  const b3InnerRef = useRef(null);
  const b3ShadeRef = useRef(null);
  const b4Ref = useRef(null);

  const pinnedLayersRef = useRef([]);

  // Initialize theme, scroll restoration, and sticky stack registry
  useEffect(() => {
    document.body.dataset.theme = 'forest';
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    pinnedLayersRef.current = [
      { inner: b1InnerRef.current, shade: b1ShadeRef.current, next: b2Ref.current },
      { inner: b2InnerRef.current, shade: b2ShadeRef.current, next: b3Ref.current },
      { inner: b3InnerRef.current, shade: b3ShadeRef.current, next: b4Ref.current },
    ];

    return () => {
      delete document.body.dataset.theme;
    };
  }, []);

  useStickyStack(pinnedLayersRef);

  return (
    <div className="home-scroll-container" style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      {/* Loading Veil: Node-link glyph sheet, text rise, 3-beat spring exit sequence */}
      <LoadingVeil 
        isReady={sceneReady} 
        onComplete={() => {
          setEntranceReady(true);
        }} 
      />

      {/* PINNED LAYER 1: Block 1 Hero */}
      <div 
        className="sticky-block-wrapper" 
        style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}
      >
        <div 
          ref={b1InnerRef} 
          className="sticky-stack-inner" 
          style={{ position: 'relative', width: '100%', transformOrigin: 'center 80%' }}
        >
          <HeroBlock 
            onSceneReady={() => setSceneReady(true)} 
            entranceReady={entranceReady} 
          />
          {/* Recede shade overlay */}
          <div 
            ref={b1ShadeRef} 
            className="sticky-stack-shade" 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: '#0A0A0A', 
              opacity: 0, 
              pointerEvents: 'none', 
              zIndex: 50 
            }} 
          />
        </div>
      </div>

      {/* PINNED LAYER 2: Block 2 Circuit */}
      <div 
        ref={b2Ref} 
        className="sticky-block-wrapper" 
        style={{ position: 'sticky', top: 0, zIndex: 2, width: '100%' }}
      >
        <div 
          ref={b2InnerRef} 
          className="sticky-stack-inner" 
          style={{ position: 'relative', width: '100%', transformOrigin: 'center 80%' }}
        >
          <CircuitBlock />
          <div 
            ref={b2ShadeRef} 
            className="sticky-stack-shade" 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: '#0A0A0A', 
              opacity: 0, 
              pointerEvents: 'none', 
              zIndex: 50 
            }} 
          />
        </div>
      </div>

      {/* PINNED LAYER 3: Block 3 Pipeline Timeline */}
      <div 
        ref={b3Ref} 
        className="sticky-block-wrapper" 
        style={{ position: 'sticky', top: 0, zIndex: 3, width: '100%' }}
      >
        <div 
          ref={b3InnerRef} 
          className="sticky-stack-inner" 
          style={{ position: 'relative', width: '100%', transformOrigin: 'center 80%' }}
        >
          <TimelineBlock />
          <div 
            ref={b3ShadeRef} 
            className="sticky-stack-shade" 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: '#0A0A0A', 
              opacity: 0, 
              pointerEvents: 'none', 
              zIndex: 50 
            }} 
          />
        </div>
      </div>

      {/* FLOW LAYER 4: Block 4 Query Modes */}
      <div ref={b4Ref} style={{ position: 'relative', zIndex: 4, width: '100%' }}>
        <QueryBlock />
      </div>

      {/* FLOW LAYER 5: Block 5 Sign-off */}
      <div style={{ position: 'relative', zIndex: 5, width: '100%' }}>
        <SignoffBlock />
      </div>
    </div>
  );
}

