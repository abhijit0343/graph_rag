/**
 * Physics-driven Text Reveal component.
 * Splits text into words or letters as inline-block spans in a flex-wrap container.
 * Driven by damped springs without overflow clipping to preserve font descenders.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Spring, SPRING_CONFIGS } from './spring';
import { ticker } from './ticker';

export function TextReveal({
  text,
  mode = 'words', // 'words' | 'letters'
  config = SPRING_CONFIGS.REVEAL,
  delayIn = 0,
  stagger = 30, // ms per unit
  className = '',
  style = {},
  columnGap = '0.3em',
  accentWord = null, // specific word to render in sand accent
  accentStyle = {},
  trigger = true, // boolean to activate spring
}) {
  const units = React.useMemo(() => {
    if (!text) return [];
    if (mode === 'letters') {
      return text.split('');
    }
    return text.split(' ');
  }, [text, mode]);

  const [springValues, setSpringValues] = useState(() =>
    units.map(() => ({ opacity: 0, y: mode === 'words' ? 0.35 : 0.3 }))
  );

  const springsRef = useRef([]);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setSpringValues(units.map(() => ({ opacity: 1, y: 0 })));
      return;
    }

    springsRef.current = units.map(() => ({
      opacitySpring: new Spring({ initial: 0, target: 0, precision: 0.001, ...config }),
      ySpring: new Spring({
        initial: mode === 'words' ? 0.35 : 0.3,
        target: mode === 'words' ? 0.35 : 0.3,
        precision: 0.005,
        ...config,
      }),
      startTime: null,
    }));

    const startTime = performance.now();

    const unsubscribe = ticker.subscribe((now) => {
      let anyActive = false;
      const nextValues = [];

      springsRef.current.forEach((sp, i) => {
        const scheduledTime = startTime + delayIn + i * stagger;
        if (trigger && now >= scheduledTime) {
          sp.opacitySpring.setTarget(1);
          sp.ySpring.setTarget(0);
        } else if (!trigger) {
          sp.opacitySpring.setTarget(0);
          sp.ySpring.setTarget(mode === 'words' ? 0.35 : 0.3);
        }

        const opacity = sp.opacitySpring.step(16);
        const y = sp.ySpring.step(16);

        if (!sp.opacitySpring.atRest || !sp.ySpring.atRest) {
          anyActive = true;
        }

        nextValues.push({ opacity, y });
      });

      setSpringValues(nextValues);
    }, () => 0);

    return () => unsubscribe();
  }, [units, mode, config, delayIn, stagger, trigger]);

  return (
    <span
      className={`text-reveal-container ${className}`}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        columnGap,
        rowGap: '0.1em',
        verticalAlign: 'baseline',
        ...style,
      }}
    >
      {/* Visually hidden text for screen readers */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {text}
      </span>

      {/* Spring animated units with aria-hidden */}
      {units.map((unit, i) => {
        const isAccent = accentWord && unit.toLowerCase().includes(accentWord.toLowerCase());
        const sv = springValues[i] || { opacity: 1, y: 0 };

        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: 'inline-block',
              opacity: sv.opacity,
              transform: `translate3d(0, ${sv.y}em, 0)`,
              willChange: 'transform, opacity',
              whiteSpace: mode === 'letters' && unit === ' ' ? 'pre' : 'normal',
              ...(isAccent ? accentStyle : {}),
            }}
          >
            {unit}
          </span>
        );
      })}
    </span>
  );
}

export function TextRevealWords({ text, stagger = 30, delayIn = 0, configName = 'REVEAL', ...props }) {
  const cfg = SPRING_CONFIGS[configName] || SPRING_CONFIGS.REVEAL;
  return <TextReveal text={text} mode="words" stagger={stagger} delayIn={delayIn} config={cfg} {...props} />;
}

export function TextRevealLetters({ text, stagger = 24, delayIn = 0, configName = 'REVEAL', ...props }) {
  const cfg = SPRING_CONFIGS[configName] || SPRING_CONFIGS.REVEAL;
  return <TextReveal text={text} mode="letters" stagger={stagger} delayIn={delayIn} config={cfg} {...props} />;
}

export default TextReveal;
