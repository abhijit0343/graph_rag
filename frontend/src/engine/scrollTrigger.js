/**
 * Precise geometric scroll triggers evaluated on ticker loop.
 * Features normalized progress calculation, interpolation, and IntersectionObserver view gating.
 */

import { useEffect, useRef, useState } from 'react';
import { ticker } from './ticker';

export function calculateScrollProgress(el, startPos = 'top_bottom', endPos = 'top_top') {
  if (!el || typeof window === 'undefined') return 0;

  const bb = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;

  const poses = {
    top_top: bb.top,
    center_top: bb.top + bb.height / 2,
    bottom_top: bb.bottom,
    top_bottom: bb.top - vh,
    center_bottom: bb.top + bb.height / 2 - vh,
    bottom_bottom: bb.bottom - vh,
    top_center: bb.top - vh / 2,
    center_center: bb.top + bb.height / 2 - vh / 2,
    bottom_center: bb.bottom - vh / 2,
  };

  const scrollStart = poses[startPos] !== undefined ? poses[startPos] : poses.top_bottom;
  const scrollEnd = poses[endPos] !== undefined ? poses[endPos] : poses.top_top;
  const length = Math.max(Math.abs(scrollStart - scrollEnd), 1);

  // When scrollStart <= 0, progress starts moving from 0 to 1
  const progress = Math.min(Math.max(0, -scrollStart / length), 1);
  return progress;
}

export function useScrollProgress(elRef, { start = 'top_bottom', end = 'top_top' } = {}) {
  const [progress, setProgress] = useState(0);
  const inViewRef = useRef(true);
  const graceFrames = useRef(10);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        inViewRef.current = true;
        graceFrames.current = 10;
      } else {
        inViewRef.current = false;
      }
    }, { rootMargin: '20% 0px 20% 0px' });

    observer.observe(el);

    const unsubscribe = ticker.subscribe(() => {
      if (!inViewRef.current) {
        if (graceFrames.current > 0) {
          graceFrames.current--;
        } else {
          return;
        }
      }

      const p = calculateScrollProgress(el, start, end);
      setProgress(p);
    }, () => 10); // 10ms evaluation rate

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [elRef, start, end]);

  return progress;
}

export function interpolateProgress(p, start, end) {
  return start + p * (end - start);
}

export function useScrollTrigger(elRef, { start = 'top bottom', end = 'top top', onUpdate } = {}) {
  const s = start.replace(' ', '_');
  const e = end.replace(' ', '_');
  const inViewRef = useRef(true);
  const graceFrames = useRef(10);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        inViewRef.current = true;
        graceFrames.current = 10;
      } else {
        inViewRef.current = false;
      }
    }, { rootMargin: '20% 0px 20% 0px' });

    observer.observe(el);

    const unsubscribe = ticker.subscribe(() => {
      if (!inViewRef.current) {
        if (graceFrames.current > 0) {
          graceFrames.current--;
        } else {
          return;
        }
      }
      const p = calculateScrollProgress(el, s, e);
      if (onUpdate) onUpdate(p);
    }, () => 10);

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [elRef, s, e, onUpdate]);
}

export function useInViewGate(elRef, { rootMargin = '0% 0% -25% 0%', once = true } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, { rootMargin });

    observer.observe(el);

    return () => observer.disconnect();
  }, [elRef, rootMargin, once]);

  return inView;
}
