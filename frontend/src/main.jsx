/**
 * Application Entry Point.
 * Loads style tokens, font definitions, and mounts React root.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import editorial styles in strict cascade order
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/cursor.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

