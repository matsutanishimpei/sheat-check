import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

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
      try {
        localStorage.removeItem('teacher_jwt');
        localStorage.removeItem('supabase_teacher_token');
        localStorage.removeItem('logged_in_teacher');
        localStorage.removeItem('teacher_auth');

        // Redirect to login page with an expiry signal query param
        if (
          window.location.pathname !== '/' &&
          !window.location.search.includes('expired=true')
        ) {
          window.location.href = '/?expired=true';
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return response;
};

// Use the current origin for the client, assuming Vite proxy in dev
// and same-domain in production. Attach headers dynamically.
const client = hc<AppType>('/', {
  fetch: customFetch,
  headers: () => {
    const headers: Record<string, string> = {};
    try {
      const token = localStorage.getItem('teacher_jwt');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return headers;
  },
});

export default client;
