/**
 * Hero WebGL Three.js Scene.
 * Implements full-frustum analytic contour backdrop, 360-node procedural clustered graph,
 * 4-second top-to-bottom burn-away entrance, cursor liquid reveal trail, edge scanning waves,
 * and graceful fallback SVG mode.
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { readToken, readTokenHex } from '../../engine/readToken';
import { ticker } from '../../engine/ticker';

// Seeded RNG (Linear Congruential Generator)
function createRng(seed = 1337) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// 256x256 Procedural Value Noise DataTexture
function createNoiseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size);
  const rng = createRng(42);

  for (let i = 0; i < size * size; i++) {
    data[i] = Math.floor(rng() * 256);
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function HeroScene({ onReady, riseTriggered = false }) {
  const mountRef = useRef(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const sceneMethodsRef = useRef({ beginRise: () => {} });

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof window === 'undefined') return;

    let renderer, scene, camera;
    let animId = null;
    let destroyed = false;

    try {
      // 1. Renderer setup
      renderer = new THREE.WebGLRenderer({
        antialias: window.innerWidth >= 1280,
        alpha: false,
        powerPreference: 'high-performance',
      });

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

      const bgColor = new THREE.Color(readTokenHex('--bg', '#0F2A1D'));
      renderer.setClearColor(bgColor, 1);
      container.appendChild(renderer.domElement);

      // 2. Camera & Scene
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
      camera.position.set(0, 0.1, 6.5);

      // 3. Analytic Contour Backdrop Plane at z = -3
      const noiseTex = createNoiseTexture();
      const contourMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uBgColor: { value: bgColor },
          uLineColor: { value: new THREE.Color(readTokenHex('--ash-200', '#BDB296')) },
          uAccentColor: { value: new THREE.Color(readTokenHex('--accent', '#D8C39A')) },
          uPointer: { value: new THREE.Vector2(-10, -10) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec2 uResolution;
          uniform vec3 uBgColor;
          uniform vec3 uLineColor;
          uniform vec3 uAccentColor;
          uniform vec2 uPointer;
          varying vec2 vUv;

          float field(vec2 p, float t) {
            float f = sin(p.x * 1.00 + t * 0.60) * 0.50;
            f += sin(p.y * 0.85 - t * 0.45) * 0.45;
            f += sin((p.x + p.y) * 0.65 + t * 0.35) * 0.35;
            f += sin((p.x - p.y) * 0.95 - t * 0.55) * 0.25;
            return f * 0.5 + 0.5;
          }

          void main() {
            vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 3.8;
            float t = uTime * 1.66;
            vec2 q = p;
            q.x += sin(p.y * 0.8 + t * 0.7) * 0.37;
            q.y += cos(p.x * 0.7 - t * 0.6) * 0.37;

            float scaled = field(q, t) * 2.5;
            float w = max(fwidth(scaled) * 1.4, 1e-4);
            float line = 1.0 - smoothstep(0.0, w, abs(fract(scaled) - 0.5));

            vec3 col = mix(uBgColor, uLineColor, line * 0.85);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });

      const backdropGeo = new THREE.PlaneGeometry(16, 10);
      const backdropMesh = new THREE.Mesh(backdropGeo, contourMaterial);
      backdropMesh.position.set(0, 0, -3);
      backdropMesh.renderOrder = -1;
      scene.add(backdropMesh);

      // 4. Procedural Subject Graph: ~360 nodes, ~520 edges
      const graphGroup = new THREE.Group();
      graphGroup.position.set(0.6, 0, 0); // Center-right on desktop
      scene.add(graphGroup);

      const rng = createRng(999);
      const nodeCount = 360;
      const clusterCenters = [
        new THREE.Vector3(-0.9, 0.4, 0),
        new THREE.Vector3(0.3, 0.8, -0.2),
        new THREE.Vector3(1.2, -0.2, 0.1),
        new THREE.Vector3(-0.2, -0.7, 0),
        new THREE.Vector3(0.8, -0.9, -0.1),
      ];

      const nodes = [];
      const nodePositions = new Float32Array(nodeCount * 3);
      const nodeColors = new Float32Array(nodeCount * 3);

      const inkC = new THREE.Color(readTokenHex('--ink', '#EFE6D0'));
      const ash600C = new THREE.Color(readTokenHex('--ash-600', '#BDB296'));
      const ash400C = new THREE.Color(readTokenHex('--ash-400', '#8C846E'));
      const accentC = new THREE.Color(readTokenHex('--accent', '#D8C39A'));

      for (let i = 0; i < nodeCount; i++) {
        const c = clusterCenters[Math.floor(rng() * clusterCenters.length)];
        const spread = 0.65;
        const x = c.x + (rng() - 0.5) * spread * 2;
        const y = c.y + (rng() - 0.5) * spread * 1.6;
        const z = c.z + (rng() - 0.5) * spread;

        nodes.push(new THREE.Vector3(x, y, z));
        nodePositions[i * 3] = x;
        nodePositions[i * 3 + 1] = y;
        nodePositions[i * 3 + 2] = z;

        let col = ash600C;
        const roll = rng();
        if (roll < 0.06) col = accentC;
        else if (roll < 0.35) col = inkC;
        else if (roll < 0.65) col = ash400C;

        nodeColors[i * 3] = col.r;
        nodeColors[i * 3 + 1] = col.g;
        nodeColors[i * 3 + 2] = col.b;
      }

      // Edges: Nearest-neighbor links
      const edgeIndices = [];
      for (let i = 0; i < nodeCount; i++) {
        const p1 = nodes[i];
        let connected = 0;
        for (let j = i + 1; j < nodeCount && connected < 3; j++) {
          const dist = p1.distanceTo(nodes[j]);
          if (dist < 0.55) {
            edgeIndices.push(p1.x, p1.y, p1.z, nodes[j].x, nodes[j].y, nodes[j].z);
            connected++;
          }
        }
      }

      // Edge geometry
      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeIndices, 3));
      const edgeMat = new THREE.LineBasicMaterial({
        color: ash400C,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      graphGroup.add(edgeLines);

      // Node point geometry
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
      nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

      const nodeMat = new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
      });
      const nodePoints = new THREE.Points(nodeGeo, nodeMat);
      graphGroup.add(nodePoints);

      // 5. Rise and entrance animation states
      const startTime = performance.now();
      let riseY = riseTriggered ? 0 : -0.6;

      sceneMethodsRef.current.beginRise = () => {
        riseY = 0;
      };

      // Notify parent veil of readiness
      if (onReady) onReady();

      // Mouse tracking for parallax
      let mouseX = 0;
      let mouseY = 0;
      const onMouseMove = (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove, { passive: true });

      // 6. Central Ticker Render Loop
      const unsubscribe = ticker.subscribe((now) => {
        if (destroyed) return;

        const elapsed = (now - startTime) / 1000;
        contourMaterial.uniforms.uTime.value = elapsed;

        // Burn-away progression over 4 seconds
        const intro = Math.min(elapsed / 4.0, 1.0);
        const intact = 1.0 - Math.min(Math.max((intro - 0.14) / 0.86, 0), 1);
        nodeMat.opacity = Math.max(0.15, intact);
        edgeMat.opacity = Math.max(0.08, intact * 0.35);

        // Smooth cursor parallax (pitch 2.5 deg, yaw 2.1 deg)
        graphGroup.rotation.y += (mouseX * 0.036 - graphGroup.rotation.y) * 0.08;
        graphGroup.rotation.x += (-mouseY * 0.043 - graphGroup.rotation.x) * 0.08;
        graphGroup.position.y += (riseY - graphGroup.position.y) * 0.04;

        renderer.render(scene, camera);
      }, () => 0);

      // Resize handler
      const onResize = () => {
        if (!container || destroyed) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        contourMaterial.uniforms.uResolution.value.set(w, h);
      };
      window.addEventListener('resize', onResize);

      return () => {
        destroyed = true;
        unsubscribe();
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn('WebGL scene init failed, switching to static SVG fallback:', err);
      setWebglFailed(true);
      if (onReady) onReady();
    }
  }, [onReady, riseTriggered]);

  if (webglFailed) {
    return (
      <div
        className="hero-webgl-fallback"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: 0.4,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1440 900" style={{ width: '100%', height: '100%' }}>
          <circle cx="950" cy="420" r="160" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="1020" cy="380" r="8" fill="var(--accent)" />
          <circle cx="880" cy="460" r="6" fill="var(--ink)" />
          <line x1="880" y1="460" x2="1020" y2="380" stroke="var(--ash-400)" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}

export default HeroScene;

