/**
 * Sticky Stack controller for Blocks 1–3.
 * Manages layer recede scale and shade darkening verbatim to specification.
 * Operates on inner wrapper elements without mutating sticky root transforms.
 */

import { useEffect } from 'react';
import { ticker } from './ticker';

export function useStickyStack(pinnedLayersRef) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const RECEDE_SCALE = 0.9;
    const RECEDE_SHADE = 0.55;
    const phone = window.matchMedia('(max-width: 639px)');

    const apply = () => {
      const view = window.innerHeight || 1;
      const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE;
      const pinned = pinnedLayersRef.current || [];

      for (const item of pinned) {
        if (!item || !item.inner || !item.shade || !item.next) continue;

        const { inner, shade, next } = item;
        const rect = next.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - rect.top / view));

        inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : '';
        inner.style.willChange = p > 0 && shrink > 0 ? 'transform' : '';
        shade.style.opacity = `${RECEDE_SHADE * p}`;
        inner.style.visibility = p >= 1 ? 'hidden' : 'visible';
      }
    };

    // Driven by rAF ticker
    const unsubscribe = ticker.subscribe(apply, () => 0);

    return () => {
      unsubscribe();
      // Clean up styles
      const pinned = pinnedLayersRef.current || [];
      for (const item of pinned) {
        if (item && item.inner) {
          item.inner.style.transform = '';
          item.inner.style.visibility = 'visible';
        }
        if (item && item.shade) {
          item.shade.style.opacity = '0';
        }
      }
    };
  }, [pinnedLayersRef]);
}

export default useStickyStack;

