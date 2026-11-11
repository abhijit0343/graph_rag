/**
 * Editorial top navigation bar.
 * Features theme-aware floating panel with hairline border and soft neutral shadow.
 * Naturally adapts between light editorial and forest themes via CSS variables.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const navItems = [
    { num: '00', label: 'Home', path: '/' },
    { num: '01', label: 'Upload & Index', path: '/index' },
    { num: '02', label: 'Ask', path: '/ask' },
    { num: '03', label: 'Graph Explorer', path: '/graph' },
    { num: '04', label: 'Evaluation', path: '/eval' },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--panel-bg)',
        borderBottom: 'var(--border-hairline)',
        boxShadow: 'var(--shadow-floating)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      <div
        className="app-container"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 'auto',
        }}
      >
        {/* Editorial Wordmark */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            GraphRAG
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ash-600)',
            }}
          >
            Local Edition
          </span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                textDecoration: 'none',
                position: 'relative',
                padding: '8px 0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-sans)',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--accent)' : 'var(--ash-600)',
                transition: 'color var(--trans-fast)',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? 'var(--accent)' : 'var(--ash-400)', fontSize: '10px' }}>
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: isActive ? '100%' : '0%',
                      height: '1px',
                      backgroundColor: 'var(--accent)',
                      transition: 'width 250ms var(--ease-editorial)',
                    }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
