import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { SaveRoomLayoutInputSchema } from '@my-app/shared';
import { z } from 'zod';
import { IRoomRepository } from './repositories/RoomRepository';
import { D1RoomRepository } from './repositories/D1RoomRepository';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  roomRepo: IRoomRepository;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for frontend requests
app.use('*', cors());

// Inject RoomRepository dependency via middleware
app.use('*', async (c, next) => {
  // Live environment injection (if not already injected by test setups)
  if (!c.get('roomRepo')) {
    c.set('roomRepo', new D1RoomRepository(c.env.DB));
  }
  await next();
});

// Chain routes to export AppType for full Hono RPC client support
const routes = app
  // 0. GET /api/hello - Health check endpoint
  .get('/api/hello', (c) => {
    return c.json({ message: 'Hello Hono!' });
  })

  // 1. GET /api/rooms/:id - Fetch classroom layout
  .get('/api/rooms/:id', async (c) => {
    const id = c.req.param('id');
    const repo = c.get('roomRepo');
    
    try {
      const room = await repo.findById(id);

      if (!room) {
        return c.json({ error: 'Room not found' }, 404);
      }

      return c.json({
        id: room.id,
        name: room.name,
        grid: room.grid,
        isActive: room.isActive,
        supabaseUrl: room.supabaseUrl || '',
        supabaseAnonKey: room.supabaseAnonKey || '',
      });
    } catch (err: any) {
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  })

  // 2. POST /api/rooms - Create new classroom layout (generates UUID)
  .post('/api/rooms', zValidator('json', SaveRoomLayoutInputSchema), async (c) => {
    const body = c.req.valid('json');
    const id = crypto.randomUUID();
    const repo = c.get('roomRepo');

    try {
      await repo.create({
        id,
        name: body.name,
        grid: body.grid,
        supabaseUrl: body.supabaseUrl || null,
        supabaseAnonKey: body.supabaseAnonKey || null,
        isActive: body.isActive !== false,
      });

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
    const repo = c.get('roomRepo');

    try {
      const exists = await repo.exists(id);

      if (!exists) {
        return c.json({ error: 'Room not found' }, 404);
      }

      await repo.update(id, {
        name: body.name,
        grid: body.grid,
        supabaseUrl: body.supabaseUrl || null,
        supabaseAnonKey: body.supabaseAnonKey || null,
        isActive: body.isActive !== false,
      });

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
    const repo = c.get('roomRepo');

    try {
      const exists = await repo.exists(id);

      if (!exists) {
        return c.json({ error: 'Room not found' }, 404);
      }

      await repo.updateStatus(id, body.isActive);

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
    const repo = c.get('roomRepo');
    try {
      const results = await repo.listAll();
      const mapped = results.map(r => ({
        id: r.id,
        name: r.name,
        supabaseUrl: r.supabaseUrl || '',
        supabaseAnonKey: r.supabaseAnonKey || '',
      }));
      return c.json({ rooms: mapped });
    } catch (err: any) {
      return c.json({ error: 'Failed to fetch rooms', message: err.message }, 500);
    }
  })

  // 5. DELETE /api/rooms/:id - Physically delete a classroom layout
  .delete('/api/rooms/:id', async (c) => {
    const id = c.req.param('id');
    const repo = c.get('roomRepo');

    try {
      const exists = await repo.exists(id);

      if (!exists) {
        return c.json({ error: 'Room not found' }, 404);
      }

      await repo.delete(id);

      return c.json({ success: true, id });
    } catch (err: any) {
      return c.json({ error: 'Failed to delete room', message: err.message }, 500);
    }
  });

export type AppType = typeof routes;
export default app;
