/**
 * Reference-counted rAF Ticker and smooth scroll engine.
 * Subscribers specify a callback and a getFramerate getter.
 * Integrates Lenis smooth scrolling inside the central tick loop.
 */

import Lenis from 'lenis';

class Ticker {
  constructor() {
    this.subscribers = new Map();
    this.nextId = 1;
    this.rafId = null;
    this.lastTime = 0;
    this.isRunning = false;
    this.lenis = null;
  }

  initLenis() {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    try {
      this.lenis = new Lenis({
        smoothWheel: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      // Register Lenis first in the subscriber chain
      this.subscribe((t) => {
        if (this.lenis) this.lenis.raf(t);
      }, () => 0);
    } catch (err) {
      console.warn('Lenis smooth scroll initialization skipped:', err);
    }
  }

  subscribe(callback, getFramerate = () => 0) {
    const id = this.nextId++;
    this.subscribers.set(id, {
      callback,
      getFramerate,
      lastTick: 0,
    });

    if (!this.isRunning && this.subscribers.size > 0) {
      this.start();
    }

    return () => {
      this.subscribers.delete(id);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (currentTime) => {
      if (!this.isRunning) return;

      for (const [id, sub] of this.subscribers.entries()) {
        const interval = sub.getFramerate();
        if (interval === 0 || currentTime - sub.lastTick >= interval) {
          sub.lastTick = currentTime;
          try {
            sub.callback(currentTime);
          } catch (e) {
            console.error('Ticker subscriber error:', e);
          }
        }
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroyLenis() {
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}

export const ticker = new Ticker();

export function subscribeTicker(callback, getFramerate) {
  return ticker.subscribe(callback, getFramerate);
}

// Initialize on client
if (typeof window !== 'undefined') {
  ticker.initLenis();
}

export default ticker;
