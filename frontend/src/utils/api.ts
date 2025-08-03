// utils/api.ts
const getApiUrl = () => {
  // In development with Codespaces, we need to use the forwarded URL
  const isDev = import.meta.env.DEV;
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Check if we're in Codespaces
  if (isDev && window.location.hostname.includes('github.dev')) {
    // Replace the frontend port with backend port in Codespaces URL
    const baseUrl = window.location.origin.replace('-5173', '-3001');
    return baseUrl;
  }
  
  // Default localhost for local development
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();

// Helper function for API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  return response;
};
