/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Detect API URL based on environment
function getApiUrl(): string {
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in browser, detect if we're on a dev tunnel
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    
    // If on dev tunnel (HTTPS with .devtunnels.ms), try to use same origin with port 8000
    // Or use relative URLs (which will use the same origin)
    if (origin.includes('.devtunnels.ms')) {
      // Try to construct backend URL from frontend URL
      // Frontend: https://q80bvqq1-3000.inc1.devtunnels.ms
      // Backend should be: https://q80bvqq1-8000.inc1.devtunnels.ms (if exposed on port 8000)
      // Or use relative URLs if backend is proxied
      const baseUrl = origin.replace(':3000', ':8000').replace('-3000', '-8000');
      return baseUrl;
    }
    
    // If on localhost, use localhost:8000
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:8000';
    }

    // If running in production and no env var is set, fall back to Render backend.
    // This prevents the app from accidentally calling localhost in production.
    return 'https://visitor-management-backend-2hof.onrender.com';
  }

  // Default fallback
  return 'http://localhost:8000';
}

export const API_URL = getApiUrl();

// Log API URL in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API Config] Using API URL:', API_URL);
  console.log('[API Config] Current origin:', window.location.origin);
}

export const API_ENDPOINTS = {
  visitors: `${API_URL}/api/visitors`,
  approvers: `${API_URL}/api/approvers`,
  icards: `${API_URL}/api/icards`,
  appointments: `${API_URL}/api/appointments`,
  auth: {
    login: `${API_URL}/api/approvers/login`,
    forgotPassword: `${API_URL}/api/approvers/forgot-password`,
  },
} as const;

/**
 * Helper function to get full image URL
 * Handles both absolute URLs and relative paths from backend
 */
export function getImageUrl(imageUrl: string | undefined | null): string | undefined {
  if (!imageUrl) return undefined;

  // If already a full URL (starts with http:// or https://), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If relative path, prepend API_URL
  // Remove leading slash if present to avoid double slashes
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${API_URL}${path}`;
}
