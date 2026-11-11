/**
 * Block 4: Ask It Anything (Query Modes)
 * Features live force graph figure bleeding off ends on upward parallax,
 * ContourCanvas background, search mode & telemetry bracket panels,
 * chamfered CTA, and 5-card query strip with crawling dashed connectors.
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Network, Database, Cpu, Compass, Layers, GitBranch, ArrowRight } from 'lucide-react';
import { useScrollTrigger, interpolateProgress } from '../../engine/scrollTrigger';
import { subscribeTicker } from '../../engine/ticker';
import ContourCanvas from '../../engine/contourCanvas';
import ChequeredDissolve from '../../engine/chequeredDissolve';
import { TextRevealWords, TextRevealLetters } from '../../engine/textReveal';
import apiClient from '../../api/client';
import GraphView from '../../components/GraphView';

const DEMO_GRAPH = {
  nodes: [
    { id: 'GraphRAG', label: 'GraphRAG', community: 0, degree: 8 },
    { id: 'Llama 3.2', label: 'Llama 3.2', community: 0, degree: 6 },
    { id: 'Ollama', label: 'Ollama', community: 0, degree: 5 },
    { id: 'Louvain', label: 'Louvain', community: 1, degree: 4 },
    { id: 'Communities', label: 'Communities', community: 1, degree: 5 },
    { id: 'Hierarchical', label: 'Hierarchical', community: 1, degree: 3 },
    { id: 'FAISS', label: 'FAISS', community: 2, degree: 5 },
    { id: 'Embeddings', label: 'Embeddings', community: 2, degree: 4 },
    { id: 'Nomic Text', label: 'Nomic Text', community: 2, degree: 3 },
    { id: 'Local Search', label: 'Local Search', community: 3, degree: 4 },
    { id: 'Global Search', label: 'Global Search', community: 3, degree: 4 },
    { id: 'Map Reduce', label: 'Map Reduce', community: 3, degree: 3 },
  ],
  links: [
    { source: 'GraphRAG', target: 'Llama 3.2', weight: 3 },
    { source: 'GraphRAG', target: 'Ollama', weight: 2 },
    { source: 'GraphRAG', target: 'FAISS', weight: 2.5 },
    { source: 'GraphRAG', target: 'Communities', weight: 3 },
    { source: 'Communities', target: 'Louvain', weight: 4 },
    { source: 'Communities', target: 'Hierarchical', weight: 2 },
    { source: 'FAISS', target: 'Embeddings', weight: 3 },
    { source: 'Embeddings', target: 'Nomic Text', weight: 2.5 },
    { source: 'GraphRAG', target: 'Local Search', weight: 2 },
    { source: 'GraphRAG', target: 'Global Search', weight: 2 },
    { source: 'Global Search', target: 'Map Reduce', weight: 3.5 },
    { source: 'Llama 3.2', target: 'Map Reduce', weight: 2 },
  ]
};

export default function QueryBlock() {
  const blockRef = useRef(null);
  const [graphData, setGraphData] = useState(DEMO_GRAPH);
  const [blockProgress, setBlockProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const [liveCardHovered, setLiveCardHovered] = useState(false);
  const [connectorOffset, setConnectorOffset] = useState(0);
  const [pulseVal, setPulseVal] = useState(0);

  // Fetch real index graph if available
  useEffect(() => {
    let mounted = true;
    apiClient.get('/graph')
      .then(res => {
        if (mounted && res.data && res.data.nodes && res.data.nodes.length > 0) {
          setGraphData(res.data);
        }
      })
      .catch(() => {
        // Fall back gracefully to seeded demo graph
      });
    return () => { mounted = false; };
  }, []);

  // Scroll trigger for upward-only parallax: moves top 0 to -3.3333cqw
  useScrollTrigger(blockRef, {
    start: "top bottom",
    end: "bottom top",
    onUpdate: (prog) => {
      setBlockProgress(prog);
      if (prog > 0.05 && !inView) {
        setInView(true);
      }
    }
  });

  // Ticker for connector crawling (looping every 5200ms) and pulse disc (3200ms)
  useEffect(() => {
    const unsub = subscribeTicker((time) => {
      const crawl = (time % 5200) / 5200;
      setConnectorOffset(crawl * 11.45);
      
      const p = (time % 3200) / 3200;
      setPulseVal(p);
    }, () => 1000 / 30);
    return unsub;
  }, []);

  const parallaxTop = interpolateProgress(blockProgress, 0, -3.3333);

  // Pulse disc calculations
  const pulseR = 5.5 + pulseVal * 5.5 * 3.4;
  const pulseOpacity = 0.5 * Math.pow(1 - pulseVal, 2);

  return (
    <section 
      ref={blockRef}
      className="query-block-section"
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-soft)',
        minHeight: '100lvh',
        width: '100%',
        overflow: 'hidden',
        color: 'var(--ink)'
      }}
    >
      {/* 2D Contour Canvas Layer (96-cell marching squares) */}
      <ContourCanvas strokeColor="var(--ash-200)" globalAlpha={0.85} />

      {/* Top Seam Dissolve from Block 3 (var(--bg)) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 30 }}>
        <ChequeredDissolve carryVar="--bg" />
      </div>

      {/* Graph Figure Layer on Upward Parallax bleeding off both ends */}
      <div 
        className="query-graph-figure-layer"
        style={{
          position: 'absolute',
          top: `${parallaxTop}cqw`,
          left: '-5%',
          width: '110%',
          height: '102%',
          pointerEvents: 'none',
          opacity: 0.65,
          zIndex: 5
        }}
      >
        <GraphView 
          data={graphData} 
          height={950} 
          width={window.innerWidth ? window.innerWidth * 1.1 : 1600} 
        />
        {/* Gradient melting graph foot into dark band */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            background: 'linear-gradient(to bottom, transparent 0%, var(--surface) 38.685%)'
          }} 
        />
      </div>

      {/* Intro Masthead & Copy (Left Side) */}
      <div 
        className="query-intro-container"
        style={{
          position: 'absolute',
          top: '6cqw',
          left: '2.2222cqw',
          zIndex: 25,
          maxWidth: '38cqw'
        }}
      >
        <h2 
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '6.6667cqw',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--accent)',
            lineHeight: 0.95,
            margin: 0
          }}
        >
          <TextRevealWords text="ask it / anything." stagger={130} />
        </h2>
      </div>

      {/* Bottom-left description column & Chamfered SVG CTA (32px above band) */}
      <div 
        className="query-left-column"
        style={{
          position: 'absolute',
          bottom: '15cqw',
          left: '2.2222cqw',
          width: '23.4722cqw',
          minWidth: '280px',
          zIndex: 25
        }}
      >
        <p 
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--ash-600)',
            textTransform: 'none',
            marginBottom: '28px'
          }}
        >
          {inView ? (
            <TextRevealWords 
              text="Specific questions follow the graph from matched entities. Broad questions map-reduce over community summaries. The router decides." 
              stagger={30}
              delayIn={2 * 130 + 90}
            />
          ) : null}
        </p>

        {/* Chamfered CTA "open ask" -> /ask (217x50, chamfer 8) */}
        <Link 
          to="/ask"
          className="cta-chamfered-btn"
          style={{
            position: 'relative',
            display: 'inline-block',
            width: '217px',
            height: '50px',
            textDecoration: 'none',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(0.75rem)',
            transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 520ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 520ms'
          }}
        >
          <svg 
            viewBox="0 0 217 50" 
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <path 
              d="M0.5 0.5H216.5V42L209 49.5H0.5Z" 
              fill="var(--surface)" 
              stroke="var(--accent)" 
              strokeWidth="1"
            />
          </svg>
          <span 
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              height: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink)'
            }}
          >
            open ask
            <ArrowRight size={15} color="var(--accent)" />
          </span>
        </Link>
      </div>

      {/* Two Bracket Panels (Right Rail, hidden below sm) */}
      <div 
        className="query-bracket-panels-rail"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '3cqw',
          right: '2.2222cqw',
          width: '24cqw',
          minWidth: '290px',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Panel 1: Search mode */}
        <div 
          className="bracket-panel"
          style={{
            position: 'relative',
            padding: '24px',
            backgroundColor: 'rgba(19, 50, 36, 0.75)',
            border: '1px solid rgba(239, 230, 208, 0.16)',
            backdropFilter: 'blur(8px)',
            opacity: inView ? 1 : 0,
            transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 320ms'
          }}
        >
          {/* Corner brackets */}
          <div className="corner-bracket-tl" style={{ position: 'absolute', top: '-1px', left: '-1px', width: '8px', height: '8px', borderTop: '2px solid var(--ink)', borderLeft: '2px solid var(--ink)' }} />
          <div className="corner-bracket-tr" style={{ position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', borderTop: '2px solid var(--ink)', borderRight: '2px solid var(--ink)' }} />
          <div className="corner-bracket-br" style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderBottom: '2px solid var(--ink)', borderRight: '2px solid var(--ink)' }} />
          <div className="corner-bracket-bl" style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '8px', height: '8px', borderBottom: '2px solid var(--ink)', borderLeft: '2px solid var(--ink)' }} />

          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ash-600)', marginBottom: '12px' }}>
            [ SEARCH MODE ]
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: '13px', textTransform: 'uppercase', color: 'var(--ink)' }}>
            <div>• auto router</div>
            <div>• local: entity hops</div>
            <div>• global: map-reduce</div>
          </div>
        </div>

        {/* Panel 2: Under the hood (4 rows with thin icons and serif figures) */}
        <div 
          className="bracket-panel"
          style={{
            position: 'relative',
            padding: '24px',
            backgroundColor: 'rgba(19, 50, 36, 0.75)',
            border: '1px solid rgba(239, 230, 208, 0.16)',
            backdropFilter: 'blur(8px)',
            opacity: inView ? 1 : 0,
            transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 460ms'
          }}
        >
          <div className="corner-bracket-tl" style={{ position: 'absolute', top: '-1px', left: '-1px', width: '8px', height: '8px', borderTop: '2px solid var(--ink)', borderLeft: '2px solid var(--ink)' }} />
          <div className="corner-bracket-tr" style={{ position: 'absolute', top: '-1px', right: '-1px', width: '8px', height: '8px', borderTop: '2px solid var(--ink)', borderRight: '2px solid var(--ink)' }} />
          <div className="corner-bracket-br" style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderBottom: '2px solid var(--ink)', borderRight: '2px solid var(--ink)' }} />
          <div className="corner-bracket-bl" style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '8px', height: '8px', borderBottom: '2px solid var(--ink)', borderLeft: '2px solid var(--ink)' }} />

          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ash-600)', marginBottom: '16px' }}>
            [ UNDER THE HOOD ]
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'router', fig: 'AUTO', icon: <Compass size={18} strokeWidth={1.25} /> },
              { label: 'local', fig: 'HOPS', icon: <GitBranch size={18} strokeWidth={1.25} /> },
              { label: 'global', fig: 'MAP', icon: <Layers size={18} strokeWidth={1.25} /> },
              { label: 'baseline', fig: 'VECTOR', icon: <Database size={18} strokeWidth={1.25} /> }
            ].map((item, rIdx) => (
              <div 
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--ash-400)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ash-600)' }}>
                  {item.icon}
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', textTransform: 'uppercase' }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 500, color: 'var(--accent)' }}>
                  {inView ? <TextRevealLetters text={item.fig} stagger={24} configName="FIGURE" /> : item.fig}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dark Band at Bottom (Height 11.7361cqw, background var(--surface)) */}
      <div 
        className="query-bottom-band"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '11.7361cqw',
          minHeight: '160px',
          backgroundColor: 'var(--surface)',
          zIndex: 20,
          borderTop: '1px solid rgba(239, 230, 208, 0.16)'
        }}
      >
        {/* Five-Card Query Strip spread about block middle */}
        <div 
          className="query-cards-strip"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3vw'
          }}
        >
          {/* Card 1: Router */}
          <div className="query-card" style={{ textAlign: 'center', textTransform: 'uppercase' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>step 1</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>router</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>auto or manual</div>
          </div>

          {/* Connector 1 */}
          <div 
            className="query-connector"
            style={{
              width: '6vw',
              height: '1px',
              backgroundImage: 'repeating-linear-gradient(to right, var(--ash-400) 0px, var(--ash-400) 7px, transparent 7px, transparent 11.45px)',
              backgroundPositionX: `${connectorOffset}px`
            }} 
          />

          {/* Card 2: Embed */}
          <div className="query-card" style={{ textAlign: 'center', textTransform: 'uppercase' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>step 2</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>embed</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>nomic text</div>
          </div>

          {/* Connector 2 */}
          <div 
            className="query-connector"
            style={{
              width: '6vw',
              height: '1px',
              backgroundImage: 'repeating-linear-gradient(to right, var(--ash-400) 0px, var(--ash-400) 7px, transparent 7px, transparent 11.45px)',
              backgroundPositionX: `${connectorOffset}px`
            }} 
          />

          {/* Card 3: Retrieve (LIVE CARD) */}
          <div 
            className="query-card query-card-live" 
            onMouseEnter={() => setLiveCardHovered(true)}
            onMouseLeave={() => setLiveCardHovered(false)}
            style={{ 
              position: 'relative',
              textAlign: 'center', 
              textTransform: 'uppercase',
              padding: '10px 16px',
              backgroundColor: 'rgba(216, 195, 154, 0.08)',
              border: '1px solid var(--accent)',
              transform: liveCardHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {/* Pulsing disc indicator */}
            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r={pulseR} stroke="var(--accent)" strokeWidth="1" fill="none" opacity={pulseOpacity} />
                <circle cx="12" cy="12" r="5.5" fill="var(--accent)" />
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>step 3 [LIVE]</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>retrieve</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>faiss top-k</div>
          </div>

          {/* Connector 3 */}
          <div 
            className="query-connector"
            style={{
              width: '6vw',
              height: '1px',
              backgroundImage: 'repeating-linear-gradient(to right, var(--ash-400) 0px, var(--ash-400) 7px, transparent 7px, transparent 11.45px)',
              backgroundPositionX: `${-connectorOffset}px`
            }} 
          />

          {/* Card 4: Expand */}
          <div className="query-card" style={{ textAlign: 'center', textTransform: 'uppercase' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>step 4</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>expand</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>graph hops</div>
          </div>

          {/* Connector 4 */}
          <div 
            className="query-connector"
            style={{
              width: '6vw',
              height: '1px',
              backgroundImage: 'repeating-linear-gradient(to right, var(--ash-400) 0px, var(--ash-400) 7px, transparent 7px, transparent 11.45px)',
              backgroundPositionX: `${-connectorOffset}px`
            }} 
          />

          {/* Card 5: Answer */}
          <div className="query-card" style={{ textAlign: 'center', textTransform: 'uppercase' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>step 5</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>answer</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ash-600)' }}>llama 3.2 3b</div>
          </div>
        </div>
      </div>
    </section>
  );
}

