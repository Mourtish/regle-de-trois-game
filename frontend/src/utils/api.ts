// utils/api.ts

/**
 * REST API base URL.
 * In dev mode we use an empty string so every fetch('/api/...') goes through
 * the Vite proxy → backend on port 3001.  This works the same on localhost
 * AND inside GitHub Codespaces / any dev-container without touching CORS.
 * In production, set VITE_API_URL to the deployed backend origin.
 */
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (import.meta.env.DEV) {
    return ''; // relative – Vite proxy forwards /api and /socket.io to backend
  }
  return 'http://localhost:3001';
};

/**
 * Socket.IO connection URL.
 * In dev mode we connect to the Vite dev-server origin itself because Vite
 * proxies /socket.io WebSocket traffic to the backend.
 */
export const getSocketUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (import.meta.env.DEV) {
    return window.location.origin; // Vite ws proxy handles /socket.io
  }
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

// Helper function for API calls with auth token support
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  return response;
};
