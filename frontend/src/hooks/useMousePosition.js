/**
 * Hook to track mouse coordinates, viewport visibility, and interactive hover states.
 */

import { useState, useEffect } from 'react';

export function useMousePosition() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [cursorState, setCursorState] = useState('default'); // 'default' | 'hover' | 'text' | 'active'
  const [isVisible, setIsVisible] = useState(false);
  const [isOnDark, setIsOnDark] = useState(false);

  useEffect(() => {
    // Only bind on pointer-fine devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Check element under cursor
      const target = e.target;
      if (!target) return;

      // Update card spotlight CSS variables if inside an editorial card
      const card = target.closest('.editorial-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }

      // Check text input
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        setCursorState('text');
        setIsOnDark(false);
        return;
      }

      // Check clickable / interactive items
      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.clickable-row') ||
        target.closest('[role="button"]') ||
        target.classList.contains('interactive-node') ||
        target.dataset?.cursor === 'pointer';

      if (isClickable) {
        setCursorState('hover');
      } else {
        setCursorState('default');
      }

      // Check if surface is dark
      const darkElem = target.closest('.dark-surface') || target.closest('.btn-primary');
      setIsOnDark(Boolean(darkElem));
    };

    const handleMouseDown = () => {
      setCursorState((prev) => (prev === 'text' ? 'text' : 'active'));
    };

    const handleMouseUp = () => {
      setCursorState('default');
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return { position, cursorState, isVisible, isOnDark };
}

