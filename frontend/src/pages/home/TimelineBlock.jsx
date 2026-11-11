/**
 * Block 3: From Text to Answers (Pipeline Timeline)
 * Features 7 sequential stages of local GraphRAG ingestion.
 * Central rail with progress line and rotating marker (5 full turns),
 * 3 parallax layers per row, verbatim PLATE_OUTLINE and PLATE_CLIP,
 * and 5% plate hover inset with other-row dimming.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useScrollTrigger, interpolateProgress } from '../../engine/scrollTrigger';
import { subscribeTicker } from '../../engine/ticker';
import { SpringSolver, CONFIGS } from '../../engine/spring';
import ChequeredDissolve from '../../engine/chequeredDissolve';
import { TextRevealWords, TextRevealLetters } from '../../engine/textReveal';

const PLATE_OUTLINE = "M13.6168 0.497469H697.378C700.858 0.497469 704.195 1.38786 706.655 2.97277C709.115 4.55769 710.498 6.70729 710.498 8.94869V411.208C710.498 413.449 709.115 415.599 706.655 417.183C704.195 418.768 700.858 419.659 697.378 419.659H460.249C454.073 419.659 447.976 420.555 442.411 422.281C436.847 424.008 431.958 426.519 428.107 429.63L399.246 452.95C395.559 455.928 390.878 458.333 385.55 459.986C380.223 461.639 374.385 462.497 368.472 462.497H13.6168C10.1373 462.497 6.80038 461.607 4.34003 460.022C1.87968 458.437 0.497469 456.288 0.497469 454.046V8.94869C0.497469 6.70729 1.87968 4.55769 4.34003 2.97277C6.80038 1.38786 10.1373 0.497469 13.6168 0.497469Z";
const PLATE_CLIP = "M 0.01915,0.00107H 0.98085C 0.98574,0.00107 0.99044,0.00300 0.99390,0.00642C 0.99736,0.00984 0.99930,0.01449 0.99930,0.01933V 0.88815C 0.99930,0.89299 0.99736,0.89763 0.99390,0.90105C 0.99044,0.90448 0.98574,0.90640 0.98085,0.90640H 0.64733C 0.63864,0.90640 0.63007,0.90834 0.62224,0.91206C 0.61442,0.91579 0.60754,0.92122 0.60212,0.92794L 0.56153,0.97830C 0.55635,0.98474 0.54976,0.98993 0.54227,0.99350C 0.53478,0.99707 0.52656,0.99892 0.51825,0.99892H 0.01915C 0.01426,0.99892 0.00956,0.99700 0.00610,0.99358C 0.00264,0.99016 0.00070,0.98551 0.00070,0.98067V 0.01933C 0.00070,0.01449 0.00264,0.00984 0.00610,0.00642C 0.00956,0.00300 0.01426,0.00107 0.01915,0.00107Z";

const STEPS = [
  {
    num: "01",
    type: "centre",
    lead: "Chunk.",
    rest: "Documents are split into about 600-character pieces with overlap, each with a stable id.",
    copyWidth: 228,
    renderArt: () => (
      <svg viewBox="0 0 400 260" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Document chunking illustration: overlapping text bars with cut guides */}
        <g stroke="var(--ash-200)" strokeWidth="1" fill="none">
          <rect x="60" y="40" width="280" height="180" rx="2" stroke="var(--ash-200)" strokeDasharray="4 4" />
          {/* Sliced windows */}
          <rect x="80" y="60" width="240" height="42" fill="var(--bg-soft)" stroke="var(--ink)" strokeWidth="1.2" />
          <line x1="95" y1="74" x2="260" y2="74" stroke="var(--ink)" strokeWidth="1.5" />
          <line x1="95" y1="88" x2="210" y2="88" stroke="var(--ash-600)" strokeWidth="1.2" />
          <text x="280" y="85" fill="var(--accent)" fontSize="10" fontFamily="var(--font-sans)" fontWeight="700">600c</text>

          <rect x="80" y="112" width="240" height="42" fill="var(--bg-soft)" stroke="var(--accent)" strokeWidth="1.2" />
          <line x1="95" y1="126" x2="280" y2="126" stroke="var(--accent)" strokeWidth="1.5" />
          <line x1="95" y1="140" x2="230" y2="140" stroke="var(--ash-600)" strokeWidth="1.2" />
          <text x="280" y="137" fill="var(--accent)" fontSize="10" fontFamily="var(--font-sans)" fontWeight="700">100c</text>

          <rect x="80" y="164" width="240" height="38" fill="var(--bg-soft)" stroke="var(--ink)" strokeWidth="1.2" />
          <line x1="95" y1="178" x2="240" y2="178" stroke="var(--ink)" strokeWidth="1.5" />
        </g>
      </svg>
    )
  },
  {
    num: "02",
    type: "side",
    side: "right",
    lead: "Extract.",
    rest: "Sentences turning into entity dots and relation lines.",
    renderArt: () => (
      <svg viewBox="0 0 300 200" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Sentences converting into entities and relation vectors */}
        <g fill="none">
          <line x1="40" y1="60" x2="110" y2="60" stroke="var(--ash-600)" strokeWidth="1.2" strokeDasharray="2 3" />
          <line x1="40" y1="80" x2="130" y2="80" stroke="var(--ash-600)" strokeWidth="1.2" strokeDasharray="2 3" />
          <circle cx="150" cy="70" r="14" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x="150" y="74" textAnchor="middle" fill="var(--accent)" fontSize="10" fontFamily="var(--font-sans)">E1</text>
          
          <path d="M 165 70 C 200 70, 200 130, 220 130" stroke="var(--ink)" strokeWidth="1.5" />
          <polygon points="220,126 226,130 220,134" fill="var(--ink)" />
          
          <circle cx="236" cy="130" r="14" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
          <text x="236" y="134" textAnchor="middle" fill="var(--ink)" fontSize="10" fontFamily="var(--font-sans)">E2</text>
          <text x="195" y="95" fill="var(--ash-600)" fontSize="9" fontFamily="var(--font-sans)">RELATION</text>
        </g>
      </svg>
    )
  },
  {
    num: "03",
    type: "centre",
    lead: "Merge.",
    rest: "Duplicate entities are merged by embedding similarity, so \"Acme\" and \"Acme Corp\" become one node.",
    copyWidth: 272,
    renderArt: () => (
      <svg viewBox="0 0 400 260" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Cross-document merge convergence */}
        <g fill="none">
          <circle cx="100" cy="80" r="24" stroke="var(--ash-200)" strokeDasharray="3 3" />
          <text x="100" y="84" textAnchor="middle" fill="var(--ash-600)" fontSize="10" fontFamily="var(--font-sans)">"Acme"</text>

          <circle cx="100" cy="180" r="24" stroke="var(--ash-200)" strokeDasharray="3 3" />
          <text x="100" y="184" textAnchor="middle" fill="var(--ash-600)" fontSize="10" fontFamily="var(--font-sans)">"Acme Corp"</text>

          {/* Convergence arrows */}
          <path d="M 128 84 C 180 90, 220 120, 260 128" stroke="var(--accent)" strokeWidth="1.5" />
          <path d="M 128 176 C 180 170, 220 140, 260 132" stroke="var(--accent)" strokeWidth="1.5" />

          {/* Unified node */}
          <circle cx="280" cy="130" r="28" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
          <circle cx="280" cy="130" r="34" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 3" />
          <text x="280" y="134" textAnchor="middle" fill="var(--ink)" fontSize="11" fontFamily="var(--font-serif)" fontWeight="700">ACME CORP</text>
        </g>
      </svg>
    )
  },
  {
    num: "04",
    type: "side",
    side: "left",
    lead: "Graph.",
    rest: "A small node-link graph with weighted edges.",
    renderArt: () => (
      <svg viewBox="0 0 300 200" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* NetworkX topology with weighted edges */}
        <g fill="none" strokeWidth="1.2">
          <line x1="80" y1="60" x2="160" y2="100" stroke="var(--ash-200)" />
          <line x1="80" y1="140" x2="160" y2="100" stroke="var(--ash-200)" />
          <line x1="160" y1="100" x2="240" y2="80" stroke="var(--accent)" strokeWidth="2.5" />
          <line x1="160" y1="100" x2="220" y2="150" stroke="var(--ink)" strokeWidth="1.5" />

          <circle cx="80" cy="60" r="10" fill="var(--surface)" stroke="var(--ink)" />
          <circle cx="80" cy="140" r="10" fill="var(--surface)" stroke="var(--ink)" />
          <circle cx="160" cy="100" r="16" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="240" cy="80" r="12" fill="var(--surface)" stroke="var(--ink)" />
          <circle cx="220" cy="150" r="10" fill="var(--surface)" stroke="var(--ash-600)" />
          
          <text x="200" y="80" fill="var(--accent)" fontSize="9" fontFamily="var(--font-sans)">w: 3.5</text>
        </g>
      </svg>
    )
  },
  {
    num: "05",
    type: "centre",
    lead: "Communities.",
    rest: "Louvain groups tightly connected entities, and each community gets a written summary.",
    copyWidth: 278,
    renderArt: () => (
      <svg viewBox="0 0 400 260" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Louvain hierarchical community partitions */}
        <g fill="none">
          <path d="M 60 70 Q 120 40, 180 80 T 170 180 T 60 160 Z" stroke="var(--ash-200)" strokeWidth="1.5" strokeDasharray="4 4" fill="rgba(216, 195, 154, 0.04)" />
          <text x="80" y="65" fill="var(--ash-600)" fontSize="10" fontFamily="var(--font-sans)">CLUSTER 01</text>
          
          <circle cx="95" cy="100" r="8" fill="var(--accent)" />
          <circle cx="140" cy="110" r="8" fill="var(--accent)" />
          <circle cx="115" cy="150" r="8" fill="var(--accent)" />
          <line x1="95" y1="100" x2="140" y2="110" stroke="var(--accent)" strokeWidth="1.2" />
          <line x1="140" y1="110" x2="115" y2="150" stroke="var(--accent)" strokeWidth="1.2" />

          <path d="M 220 80 Q 300 50, 350 100 T 330 200 T 210 180 Z" stroke="var(--ash-200)" strokeWidth="1.5" strokeDasharray="4 4" fill="rgba(239, 230, 208, 0.04)" />
          <text x="240" y="75" fill="var(--ash-600)" fontSize="10" fontFamily="var(--font-sans)">CLUSTER 02</text>

          <circle cx="260" cy="120" r="8" fill="var(--ink)" />
          <circle cx="310" cy="115" r="8" fill="var(--ink)" />
          <circle cx="280" cy="165" r="8" fill="var(--ink)" />
          <line x1="260" y1="120" x2="310" y2="115" stroke="var(--ink)" strokeWidth="1.2" />
          <line x1="310" y1="115" x2="280" y2="165" stroke="var(--ink)" strokeWidth="1.2" />

          {/* Cross boundary weak link */}
          <line x1="140" y1="110" x2="260" y2="120" stroke="var(--ash-600)" strokeWidth="1" strokeDasharray="2 3" />
        </g>
      </svg>
    )
  },
  {
    num: "06",
    type: "side",
    side: "right",
    lead: "Summaries.",
    rest: "Clusters collapsing into report cards.",
    renderArt: () => (
      <svg viewBox="0 0 300 200" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Map-reduce summary report cards */}
        <g fill="none">
          <rect x="70" y="45" width="160" height="110" rx="2" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
          <line x1="90" y1="70" x2="180" y2="70" stroke="var(--ink)" strokeWidth="1.5" />
          <line x1="90" y1="88" x2="210" y2="88" stroke="var(--ash-600)" strokeWidth="1.2" />
          <line x1="90" y1="104" x2="195" y2="104" stroke="var(--ash-600)" strokeWidth="1.2" />
          <line x1="90" y1="120" x2="160" y2="120" stroke="var(--ash-600)" strokeWidth="1.2" />
          
          <rect x="180" y="55" width="38" height="16" fill="rgba(216, 195, 154, 0.15)" stroke="var(--accent)" strokeWidth="0.8" />
          <text x="199" y="66" textAnchor="middle" fill="var(--accent)" fontSize="8" fontFamily="var(--font-sans)">C-SUMMARY</text>
        </g>
      </svg>
    )
  },
  {
    num: "07",
    type: "centre",
    lead: "Embed.",
    rest: "Chunks, entities and summaries are embedded locally and stored in three FAISS indexes.",
    copyWidth: 284,
    renderArt: () => (
      <svg viewBox="0 0 400 260" className="plate-art-svg" preserveAspectRatio="xMidYMid meet">
        {/* Multi-dimensional FAISS embedding vector lattice */}
        <g fill="none" strokeWidth="1">
          <rect x="70" y="50" width="80" height="60" fill="var(--surface)" stroke="var(--ink)" strokeDasharray="2 2" />
          <text x="110" y="85" textAnchor="middle" fill="var(--ink)" fontSize="9" fontFamily="var(--font-sans)">CHUNKS.IDX</text>

          <rect x="160" y="100" width="80" height="60" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x="200" y="135" textAnchor="middle" fill="var(--accent)" fontSize="9" fontFamily="var(--font-sans)" fontWeight="700">ENTITIES.IDX</text>

          <rect x="250" y="150" width="80" height="60" fill="var(--surface)" stroke="var(--ink)" strokeDasharray="2 2" />
          <text x="290" y="185" textAnchor="middle" fill="var(--ink)" fontSize="9" fontFamily="var(--font-sans)">COMMUNITY.IDX</text>

          {/* Dimensional coordinate axes */}
          <line x1="50" y1="220" x2="350" y2="220" stroke="var(--ash-200)" />
          <line x1="50" y1="220" x2="50" y2="40" stroke="var(--ash-200)" />
          <line x1="50" y1="220" x2="20" y2="240" stroke="var(--ash-200)" />
          <text x="350" y="235" fill="var(--ash-600)" fontSize="9" fontFamily="var(--font-sans)">DIM 768</text>
        </g>
      </svg>
    )
  }
];

export default function TimelineBlock() {
  const blockRef = useRef(null);
  const railRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeProgress, setActiveProgress] = useState(0);

  // Scroll Trigger on the whole block to drive central rail progress
  useScrollTrigger(blockRef, {
    start: "top center",
    end: "bottom bottom",
    onUpdate: (prog) => {
      setActiveProgress(prog);
    }
  });

  // Calculate rail run and rotation (5 full turns = 1800 deg)
  // Rest stops exactly on the last step (index 6)
  const restDistance = 2150; // total rail travel in px
  const runPx = activeProgress * restDistance;
  const rotationDeg = activeProgress * 1800;

  return (
    <section 
      ref={blockRef} 
      className="timeline-block-section"
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg)',
        width: '100%',
        paddingBottom: '10.4167cqw',
        overflow: 'hidden',
        color: 'var(--ink)'
      }}
    >
      {/* Top Seam Dissolve from Block 2 (var(--surface)) to Block 3 (var(--bg)) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 30 }}>
        <ChequeredDissolve carryVar="--surface" />
      </div>

      {/* Block Heading: absolute top-right at gutter 2.2222cqw */}
      <div 
        className="timeline-masthead"
        style={{
          position: 'absolute',
          top: '3.5cqw',
          right: '2.2222cqw',
          zIndex: 25,
          textAlign: 'right'
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
          <TextRevealWords text="from text / to answers." stagger={130} />
        </h2>
      </div>

      {/* Central Rail Track & Marker (hidden on mobile) */}
      <div 
        ref={railRef}
        className="timeline-central-rail"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '169px',
          bottom: '100px',
          transform: 'translateX(-50%)',
          width: '1.1111cqw',
          minWidth: '16px',
          zIndex: 15,
          pointerEvents: 'none'
        }}
      >
        <svg 
          viewBox="0 0 16 2400" 
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {/* Base track: solid for first 98px, then dashed 6/6 */}
          <line x1="8" y1="0" x2="8" y2="98" stroke="var(--ash-200)" strokeWidth="1" />
          <line x1="8" y1="98" x2="8" y2="2400" stroke="var(--ash-200)" strokeWidth="1" strokeDasharray="6 6" />

          {/* Active progress track */}
          <rect x="7.5" y="0" width="1" height={runPx} fill="var(--ink)" />

          {/* Rotating marker square of side 9px (20px below lg), 5 full turns */}
          <rect 
            x="3.5" 
            y={runPx - 4.5} 
            width="9" 
            height="9" 
            fill="var(--ink)"
            transform={`rotate(${rotationDeg} 8 ${runPx})`}
          />
        </svg>
      </div>

      {/* Seven Stage Rows Container */}
      <div 
        className="timeline-rows-container"
        style={{
          position: 'relative',
          width: '100%',
          marginTop: '169px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0
        }}
      >
        {STEPS.map((step, idx) => (
          <TimelineRow 
            key={step.num}
            step={step}
            index={idx}
            isHovered={hoveredIndex === idx}
            isAnyHovered={hoveredIndex !== null}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Single Row Component in the 7-stage Ingestion Timeline
 */
function TimelineRow({ step, index, isHovered, isAnyHovered, onMouseEnter, onMouseLeave }) {
  const rowRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [rowProgress, setRowProgress] = useState(0.5);
  const [settledOpacity, setSettledOpacity] = useState(1);

  const isCentre = step.type === 'centre';
  const rowHeight = isCentre ? 462 : 217;

  // Parallax scrubbing over the row crossing ("top bottom" -> "bottom top")
  useScrollTrigger(rowRef, {
    start: "top bottom",
    end: "bottom top",
    onUpdate: (prog) => {
      setRowProgress(prog);
      if (prog > 0.05 && !inView) {
        setInView(true);
      }
    }
  });

  // Parallax offsets (scrubbed, moving on top, never transforms)
  const plateTravel = isCentre ? 20 : 60;
  const plateTopOffset = interpolateProgress(rowProgress, plateTravel, -plateTravel);
  const copyTopOffset = interpolateProgress(rowProgress, 110, -110);
  const artTopOffset = interpolateProgress(rowProgress, -10, 0); // overscanned scrub

  // On centre rows, step number settles from 1 to 0.4 after 2200ms hold with YEAR_SETTLE
  useEffect(() => {
    if (inView && isCentre) {
      const timer = setTimeout(() => {
        setSettledOpacity(0.4);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [inView, isCentre]);

  // Row dimming to 0.3 when another row is hovered
  const rowOpacity = isAnyHovered && !isHovered ? 0.3 : 1;

  return (
    <div 
      ref={rowRef}
      className={`timeline-row timeline-row-${step.type} ${isCentre ? 'is-centre' : 'is-side'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        height: `${rowHeight}px`,
        opacity: rowOpacity,
        transition: 'opacity 700ms cubic-bezier(0.33, 0, 0, 1)'
      }}
    >
      {/* Layer 1: The Plate */}
      <div 
        className="timeline-plate-wrapper"
        style={{
          position: 'absolute',
          top: `${plateTopOffset}px`,
          width: isCentre ? '710px' : '333px',
          height: '100%',
          maxHeight: `${rowHeight}px`,
          left: isCentre 
            ? '50%' 
            : step.side === 'left' 
              ? '2.2222cqw' 
              : 'auto',
          right: step.side === 'right' ? '2.2222cqw' : 'auto',
          transform: isCentre ? 'translateX(-50%)' : 'none',
          transition: 'inset 700ms cubic-bezier(0.33, 0, 0, 1)'
        }}
      >
        {/* Plate fill with PLATE_CLIP and 5% hover inset */}
        <div 
          className="timeline-plate-fill"
          style={{
            position: 'absolute',
            inset: isHovered ? '5%' : '0%',
            overflow: 'hidden',
            backgroundColor: 'var(--surface)',
            clipPath: `path("${PLATE_CLIP}")`,
            WebkitClipPath: `path("${PLATE_CLIP}")`,
            transition: 'inset 700ms cubic-bezier(0.33, 0, 0, 1)'
          }}
        >
          {/* Generated SVG hairline illustration inside fill */}
          <div 
            style={{
              position: 'absolute',
              top: `${artTopOffset}%`,
              left: 0,
              width: '100%',
              height: '110%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            {step.renderArt()}
          </div>
        </div>

        {/* Plate Outline SVG with PLATE_OUTLINE (stays at boundary) */}
        <svg 
          viewBox="0 0 710.995 462.995" 
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            stroke: 'var(--ash-200)',
            strokeWidth: 1,
            fill: 'none',
            vectorEffect: 'non-scaling-stroke'
          }}
        >
          <path d={PLATE_OUTLINE} />
        </svg>

        {/* Layer 2: Step Number (centred on plate) */}
        <div 
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20,
            pointerEvents: 'none',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: 'max(36px, var(--year-min, 0px))',
            color: 'var(--accent)',
            opacity: settledOpacity,
            transition: 'opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {inView ? (
            <TextRevealLetters text={step.num} stagger={26} configName="YEAR" />
          ) : (
            step.num
          )}
        </div>
      </div>

      {/* Layer 3: Copy Column (centre rows only) */}
      {isCentre && (
        <div 
          className="timeline-copy-column"
          style={{
            position: 'absolute',
            left: 'calc(50% + 380px)',
            top: `calc(50% + ${copyTopOffset}px)`,
            transform: 'translateY(-50%)',
            zIndex: 20,
            width: `min(max(${step.copyWidth}px, var(--copy-min-w, 0px)), var(--copy-max-w, 100vw))`,
            lineHeight: 1.2,
            textTransform: 'uppercase',
            color: 'var(--ink)'
          }}
        >
          <div 
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'translateY(0)' : 'translateY(0.75rem)',
              transition: 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 220ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 220ms'
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 'max(18px, var(--copy-min-size, 0px))', color: 'var(--accent)', display: 'block', marginBottom: '6px' }}>
              {step.lead}
            </span>
            <span style={{ fontWeight: 400, fontSize: '13px', color: 'var(--ash-600)', display: 'block', letterSpacing: '0.02em' }}>
              {step.rest}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

