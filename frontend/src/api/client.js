/**
 * Axios API client with configurable base URL and specialized timeout rules.
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s default for standard API routes
});

// Remove timeout specifically for /query and /evaluate which execute local LLMs sequentially
apiClient.interceptors.request.use((config) => {
  if (config.url && (config.url.includes('/query') || config.url.includes('/evaluate') || config.url.includes('/index'))) {
    config.timeout = 0; // No timeout for slow local inferences
  }
  return config;
});

// Normalize error messages to always yield a clean string detail
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected server error occurred.';
    if (error.response?.data?.detail) {
      message = error.response.data.detail;
    } else if (error.message) {
      if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to backend server. Ensure FastAPI is running on http://localhost:8000.';
      } else {
        message = error.message;
      }
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;

