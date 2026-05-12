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

let csrfToken: string | null = null;

/**
 * Fetch CSRF token from backend on app initialization.
 * Must be called once on app boot before making state-changing requests.
 */
export const initializeCsrfToken = async () => {
  try {
    const response = await fetch(`${API_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
};

/**
 * Helper function for API calls with CSRF and cookie-based auth support.
 * Tokens are stored in secure HttpOnly cookies, not in localStorage.
 * CSRF token is sent as X-CSRF-Token header for state-changing requests.
 */
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  // Add CSRF token header for state-changing requests
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Include cookies (authToken) in request
  });
  
  return response;
};
