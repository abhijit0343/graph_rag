/**
 * Magnetic button that subtly pulls toward cursor when within proximity (~80px).
 * Springs back gently on leave.
 */

import React, { useRef, useState } from 'react';

export default function MagneticButton({
  children,
  className = 'btn btn-primary',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
  ...props
}) {
  const btnRef = useRef(null);
  const [transform, setTransform] = useState('translate3d(0, 0, 0)');

  const handleMouseMove = (e) => {
    if (disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const distance = Math.hypot(distX, distY);

    // Magnetic threshold radius 80px
    if (distance < 80) {
      const pullFactor = 0.22;
      const offsetX = distX * pullFactor;
      const offsetY = distY * pullFactor;
      setTransform(`translate3d(${offsetX}px, ${offsetY}px, 0)`);
    } else {
      setTransform('translate3d(0, 0, 0)');
    }
  };

  const handleMouseLeave = () => {
    setTransform('translate3d(0, 0, 0)');
  };

  return (
    <button
      ref={btnRef}
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), background-color 250ms ease, border-color 250ms ease, color 250ms ease',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

