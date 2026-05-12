import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

// Use the current origin for the client, assuming Vite proxy in dev
// and same-domain in production. Attach headers dynamically.
const client = hc<AppType>('/', {
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
