/**
 * Root React Application Component.
 * Supports the 5-block art-directed Home route ("/") and operational routes:
 * /index (Upload & Ingestion), /ask (Query), /graph (Graph Explorer), /eval (Evaluation Benchmark).
 * Features warm light ash background, fixed paper-grain overlay, background vertical lines,
 * mouse-following ambient dark-red radial glow, and slim black footer.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Cursor from './components/Cursor';
import Home from './pages/home/Home';
import UploadIndex from './pages/UploadIndex';
import Ask from './pages/Ask';
import GraphExplorer from './pages/GraphExplorer';
import Evaluation from './pages/Evaluation';

function AppLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      {/* Background Layer 1: Faint vertical lines every 140px at 3.5% black opacity */}
      <div className="editorial-bg-grid" aria-hidden="true" />

      {/* Background Layer 2: Mouse-following soft dark-red radial glow (~520px) */}
      <div className="editorial-ambient-glow" aria-hidden="true" />

      {/* Background Layer 3: Subtle paper-grain overlay (inline SVG feTurbulence, multiply blend) */}
      <div className="editorial-grain-overlay" aria-hidden="true" />

      {/* Custom Signature Ball Cursor */}
      <Cursor />

      {/* Floating Navbar */}
      <Navbar />

      {/* Main page content area: full bleed for Home, padded container for standard pages */}
      <main className={isHome ? "app-main-full" : "app-container"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<UploadIndex />} />
          <Route path="/upload" element={<UploadIndex />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/graph" element={<GraphExplorer />} />
          <Route path="/eval" element={<Evaluation />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Slim Black Footer for standard routes (Home has Block 5 Sign-off) */}
      {!isHome && (
        <footer className="editorial-footer">
          <div className="app-container footer-inner">
            <div className="footer-brand">
              <span className="footer-wordmark">GraphRAG</span>
              <span className="footer-tagline">Local Editorial Intelligence</span>
            </div>
            <div className="footer-links">
              <Link to="/" className="footer-link">00 / Home</Link>
              <Link to="/index" className="footer-link">01 / Ingestion</Link>
              <Link to="/ask" className="footer-link">02 / Query</Link>
              <Link to="/graph" className="footer-link">03 / Topology</Link>
              <Link to="/eval" className="footer-link">04 / Benchmark</Link>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
