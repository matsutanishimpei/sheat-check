import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { SaveRoomLayoutInputSchema } from '@my-app/shared';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend requests
app.use('*', cors());

// Chain routes to export AppType for full Hono RPC client support
const routes = app
  // 0. GET /api/hello - Health check endpoint
  .get('/api/hello', (c) => {
    return c.json({ message: 'Hello Hono!' });
  })

  // 1. GET /api/rooms/:id - Fetch classroom layout
  .get('/api/rooms/:id', async (c) => {
    const id = c.req.param('id');
    
    try {
      const room = await c.env.DB.prepare('SELECT id, name, layout_data, supabase_url, supabase_anon_key FROM rooms WHERE id = ?')
        .bind(id)
        .first<{ id: string; name: string; layout_data: string; supabase_url: string | null; supabase_anon_key: string | null }>();

      if (!room) {
        return c.json({ error: 'Room not found' }, 404);
      }

      const layouts = JSON.parse(room.layout_data);

      return c.json({
        id: room.id,
        name: room.name,
        layouts,
        supabaseUrl: room.supabase_url || '',
        supabaseAnonKey: room.supabase_anon_key || '',
      });
    } catch (err: any) {
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  })

  // 2. POST /api/rooms - Create new classroom layout (generates UUID)
  .post('/api/rooms', zValidator('json', SaveRoomLayoutInputSchema), async (c) => {
    const body = c.req.valid('json');
    const id = crypto.randomUUID();

    try {
      const layoutDataStr = JSON.stringify(body.layouts);

      await c.env.DB.prepare('INSERT INTO rooms (id, name, layout_data, supabase_url, supabase_anon_key) VALUES (?, ?, ?, ?, ?)')
        .bind(id, body.name, layoutDataStr, body.supabaseUrl, body.supabaseAnonKey)
        .run();

      return c.json({
        id,
        name: body.name,
        layouts: body.layouts,
        supabaseUrl: body.supabaseUrl,
        supabaseAnonKey: body.supabaseAnonKey,
      }, 201);
    } catch (err: any) {
      return c.json({ error: 'Failed to create room', message: err.message }, 500);
    }
  })

  // 3. PUT /api/rooms/:id - Update existing classroom layout (supports up to 5 cases via validation)
  .put('/api/rooms/:id', zValidator('json', SaveRoomLayoutInputSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    try {
      // Check if room exists
      const existing = await c.env.DB.prepare('SELECT 1 FROM rooms WHERE id = ?')
        .bind(id)
        .first();

      if (!existing) {
        return c.json({ error: 'Room not found' }, 404);
      }

      const layoutDataStr = JSON.stringify(body.layouts);

      await c.env.DB.prepare('UPDATE rooms SET name = ?, layout_data = ?, supabase_url = ?, supabase_anon_key = ? WHERE id = ?')
        .bind(body.name, layoutDataStr, body.supabaseUrl, body.supabaseAnonKey, id)
        .run();

      return c.json({
        id,
        name: body.name,
        layouts: body.layouts,
        supabaseUrl: body.supabaseUrl,
        supabaseAnonKey: body.supabaseAnonKey,
      });
    } catch (err: any) {
      return c.json({ error: 'Failed to update room', message: err.message }, 500);
    }
  })

  // 4. GET /api/rooms - List all saved rooms
  .get('/api/rooms', async (c) => {
    try {
      const { results } = await c.env.DB.prepare('SELECT id, name FROM rooms').all<{ id: string; name: string }>();
      return c.json({ rooms: results || [] });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch rooms', message: err.message }, 500);
    }
  });

export type AppType = typeof routes;
export default app;
