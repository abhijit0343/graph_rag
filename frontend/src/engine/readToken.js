/**
 * Runtime CSS token reader.
 * Uses a cached probe element to resolve CSS variable colors and dimensions
 * dynamically from computed styles, ensuring canvases and shaders never hardcode literals.
 */

let probeEl = null;

export function readToken(varName, fallback = '#EFE6D0') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }

  if (!probeEl) {
    probeEl = document.createElement('div');
    probeEl.style.position = 'fixed';
    probeEl.style.top = '-9999px';
    probeEl.style.left = '-9999px';
    probeEl.style.pointerEvents = 'none';
    probeEl.style.visibility = 'hidden';
    document.body.appendChild(probeEl);
  }

  probeEl.style.color = `var(${varName}, ${fallback})`;
  const computed = window.getComputedStyle(probeEl).color;
  return computed || fallback;
}

export function readTokenHex(varName, fallback = '#EFE6D0') {
  const val = readToken(varName, fallback);
  // Parse rgb / rgba to hex if needed for WebGL Three.Color
  if (val.startsWith('rgb')) {
    const parts = val.match(/\d+/g);
    if (parts && parts.length >= 3) {
      const r = parseInt(parts[0], 10).toString(16).padStart(2, '0');
      const g = parseInt(parts[1], 10).toString(16).padStart(2, '0');
      const b = parseInt(parts[2], 10).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return val;
}

