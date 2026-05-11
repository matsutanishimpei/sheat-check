import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { SaveRoomLayoutInputSchema } from '@my-app/shared';
import { z } from 'zod';

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
      const room = await c.env.DB.prepare('SELECT id, name, layout_data, supabase_url, supabase_anon_key, is_active FROM rooms WHERE id = ?')
        .bind(id)
        .first<{ id: string; name: string; layout_data: string; supabase_url: string | null; supabase_anon_key: string | null; is_active: number | null }>();

      if (!room) {
        return c.json({ error: 'Room not found' }, 404);
      }

      const grid = JSON.parse(room.layout_data);
      const isActive = room.is_active !== 0; // null/1 -> true, 0 -> false

      return c.json({
        id: room.id,
        name: room.name,
        grid,
        isActive,
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
      const layoutDataStr = JSON.stringify(body.grid);
      const isActiveVal = body.isActive !== false ? 1 : 0;

      await c.env.DB.prepare('INSERT INTO rooms (id, name, layout_data, supabase_url, supabase_anon_key, is_active) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, body.name, layoutDataStr, body.supabaseUrl, body.supabaseAnonKey, isActiveVal)
        .run();

      return c.json({
        id,
        name: body.name,
        grid: body.grid,
        isActive: body.isActive !== false,
        supabaseUrl: body.supabaseUrl,
        supabaseAnonKey: body.supabaseAnonKey,
      }, 201);
    } catch (err: any) {
      return c.json({ error: 'Failed to create room', message: err.message }, 500);
    }
  })

  // 3. PUT /api/rooms/:id - Update existing classroom layout
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

      const layoutDataStr = JSON.stringify(body.grid);
      const isActiveVal = body.isActive !== false ? 1 : 0;

      await c.env.DB.prepare('UPDATE rooms SET name = ?, layout_data = ?, supabase_url = ?, supabase_anon_key = ?, is_active = ? WHERE id = ?')
        .bind(body.name, layoutDataStr, body.supabaseUrl, body.supabaseAnonKey, isActiveVal, id)
        .run();

      return c.json({
        id,
        name: body.name,
        grid: body.grid,
        isActive: body.isActive !== false,
        supabaseUrl: body.supabaseUrl,
        supabaseAnonKey: body.supabaseAnonKey,
      });
    } catch (err: any) {
      return c.json({ error: 'Failed to update room', message: err.message }, 500);
    }
  })

  // 3.5. PATCH /api/rooms/:id/status - Lightweight status toggle (Open/Closed)
  .patch('/api/rooms/:id/status', zValidator('json', z.object({ isActive: z.boolean() })), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');

    try {
      const existing = await c.env.DB.prepare('SELECT 1 FROM rooms WHERE id = ?')
        .bind(id)
        .first();

      if (!existing) {
        return c.json({ error: 'Room not found' }, 404);
      }

      const isActiveVal = body.isActive ? 1 : 0;

      await c.env.DB.prepare('UPDATE rooms SET is_active = ? WHERE id = ?')
        .bind(isActiveVal, id)
        .run();

      return c.json({
        id,
        isActive: body.isActive,
      });
    } catch (err: any) {
      return c.json({ error: 'Failed to update status', message: err.message }, 500);
    }
  })

  // 4. GET /api/rooms - List all saved rooms
  .get('/api/rooms', async (c) => {
    try {
      const { results } = await c.env.DB.prepare('SELECT id, name, supabase_url, supabase_anon_key FROM rooms').all<{ id: string; name: string; supabase_url: string | null; supabase_anon_key: string | null }>();
      const mapped = (results || []).map(r => ({
        id: r.id,
        name: r.name,
        supabaseUrl: r.supabase_url || '',
        supabaseAnonKey: r.supabase_anon_key || '',
      }));
      return c.json({ rooms: mapped });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch rooms', message: err.message }, 500);
    }
  })

  // 5. DELETE /api/rooms/:id - Physically delete a classroom layout
  .delete('/api/rooms/:id', async (c) => {
    const id = c.req.param('id');

    try {
      const existing = await c.env.DB.prepare('SELECT 1 FROM rooms WHERE id = ?')
        .bind(id)
        .first();

      if (!existing) {
        return c.json({ error: 'Room not found' }, 404);
      }

      await c.env.DB.prepare('DELETE FROM rooms WHERE id = ?')
        .bind(id)
        .run();

      return c.json({ success: true, id });
    } catch (err: any) {
      return c.json({ error: 'Failed to delete room', message: err.message }, 500);
    }
  });

export type AppType = typeof routes;
export default app;
