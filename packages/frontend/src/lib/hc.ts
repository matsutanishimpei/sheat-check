import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';
import { teacherAuth } from './storage';

// Use a custom fetch to act as a global response interceptor for 401 Unauthorized
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  if (response.status === 401) {
    const urlString =
      typeof input === 'string'
        ? input
        : input instanceof Request
        ? input.url
        : input.toString();

    // Do not redirect on login attempts themselves
    if (!urlString.includes('/api/auth/teacher/login')) {
      teacherAuth.clear();

      // Redirect to login page with an expiry signal query param
      if (
        window.location.pathname !== '/' &&
        !window.location.search.includes('expired=true')
      ) {
        window.location.href = '/?expired=true';
      }
    }
  }

  return response;
};

// Use VITE_API_URL if configured (cross-origin in production), otherwise fallback to root "/" for local proxy dev.
const apiUrl = import.meta.env.VITE_API_URL || '/';
const client = hc<AppType>(apiUrl, {
  fetch: customFetch,
  headers: () => {
    const headers: Record<string, string> = {};
    const token = teacherAuth.getJwt();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },
});

export default client;
