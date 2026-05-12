import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { SaveRoomLayoutInputSchema, TeacherLoginInputSchema } from '@my-app/shared';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { IRoomRepository } from './repositories/RoomRepository';
import { D1RoomRepository } from './repositories/D1RoomRepository';
import { TeacherRepository } from './repositories/TeacherRepository';
import { D1TeacherRepository } from './repositories/D1TeacherRepository';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  SUPABASE_JWT_SECRET: string;
  INITIAL_TEACHER_USERNAME?: string;
  INITIAL_TEACHER_PASSWORD?: string;
};

type Variables = {
  roomRepo: IRoomRepository;
  teacherRepo: TeacherRepository;
  teacherAuthUser?: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for frontend requests
app.use('*', cors());

// Teacher Authentication Helper (Avoids breaking Hono RPC chain inference)
const verifyTeacher = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('認証トークンが見つかりません。再ログインしてください。');
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env?.JWT_SECRET || 'dev-app-jwt-secret-key-123';

  try {
    const payload = await verify(token, jwtSecret, 'HS256');
    if (payload.role !== 'teacher') {
      throw new Error('権限がありません。教員アカウントが必要です。');
    }
    return payload;
  } catch (err) {
    throw new Error('有効期限切れ、または無効な認証トークンです。再ログインしてください。');
  }
};

// Inject repositories dependency via middleware
app.use('*', async (c, next) => {
  // Live environment injection (if not already injected by test setups)
  if (!c.get('roomRepo')) {
    c.set('roomRepo', new D1RoomRepository(c.env.DB));
  }
  if (!c.get('teacherRepo')) {
    c.set('teacherRepo', new D1TeacherRepository(c.env.DB));
  }

  // Self-healing / Dynamic Seeding: Ensure at least one teacher exists dynamically at boot time
  const teacherRepo = c.get('teacherRepo');
  if (teacherRepo) {
    try {
      const list = await teacherRepo.listAll();
      if (list.length === 0) {
        const username = c.env?.INITIAL_TEACHER_USERNAME || 'teacher_admin';
        const password = c.env?.INITIAL_TEACHER_PASSWORD || 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);
        await teacherRepo.create({
          id: 'teacher-default-uuid',
          username,
          passwordHash,
        });
      }
    } catch (err) {
      console.error('Failed to auto-seed default teacher account:', err);
    }
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
  })

  // 6. POST /api/auth/teacher/login - Teacher credentials validation and JWT token issuance
  .post('/api/auth/teacher/login', zValidator('json', TeacherLoginInputSchema), async (c) => {
    const { username, password } = c.req.valid('json');
    const repo = c.get('teacherRepo');

    try {
      const teacher = await repo.findByUsername(username);
      if (!teacher) {
        return c.json({ error: 'ユーザー名またはパスワードが正しくありません' }, 401);
      }

      // Verify password hash via bcrypt
      const isMatch = await bcrypt.compare(password, teacher.passwordHash);
      if (!isMatch) {
        return c.json({ error: 'ユーザー名またはパスワードが正しくありません' }, 401);
      }

      // Generate standard Teacher Auth JWT
      const jwtSecret = c.env?.JWT_SECRET || 'dev-app-jwt-secret-key-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
      const token = await sign(
        {
          sub: teacher.id,
          username: teacher.username,
          role: 'teacher',
          exp: expiresAt,
        },
        jwtSecret
      );

      // Generate custom Supabase Access Token (Approach B)
      const supabaseJwtSecret = c.env?.SUPABASE_JWT_SECRET || 'dev-supabase-jwt-secret-key-456';
      const supabaseExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12; // 12 hours
      const supabaseToken = await sign(
        {
          role: 'authenticated', // Supabase custom real-time auth role
          iss: 'supabase',
          exp: supabaseExpiresAt,
          user_role: 'teacher',
          userId: teacher.id,
        },
        supabaseJwtSecret
      );

      return c.json({
        token,
        supabaseToken,
        teacher: {
          id: teacher.id,
          username: teacher.username,
        }
      });
    } catch (err: any) {
      console.error('LOGIN ERROR DETECTED:', err);
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  })

  // 7. POST /api/rooms/:id/student-token - Issue custom Supabase access token for checking-in student
  .post('/api/rooms/:id/student-token', zValidator('json', z.object({
    studentId: z.string().trim().min(1),
    name: z.string().trim().min(1),
  })), async (c) => {
    const roomId = c.req.param('id');
    const { studentId, name } = c.req.valid('json');
    const roomRepo = c.get('roomRepo');

    try {
      const exists = await roomRepo.exists(roomId);
      if (!exists) {
        return c.json({ error: '指定された教室が見つかりません' }, 404);
      }

      // Generate lightweight Student Supabase Token (Approach B)
      const supabaseJwtSecret = c.env?.SUPABASE_JWT_SECRET || 'dev-supabase-jwt-secret-key-456';
      const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 6; // 6 hours
      const supabaseToken = await sign(
        {
          role: 'anon', // Standard public anonymous role
          iss: 'supabase',
          exp: expiresAt,
          user_role: 'student',
          studentId,
          name,
          roomId,
        },
        supabaseJwtSecret
      );

      return c.json({
        supabaseToken,
        studentId,
        name,
        roomId
      });
    } catch (err: any) {
      console.error('STUDENT TOKEN ERROR DETECTED:', err);
      return c.json({ error: 'Internal Server Error', message: err.message }, 500);
    }
  })
  
  // 👥 Teacher Account Management (Phase 17 CRUD)
  .get('/api/teachers', async (c) => {
    try {
      await verifyTeacher(c);
    } catch (err: any) {
      return c.json({ error: err.message }, 401);
    }

    const repo = c.get('teacherRepo');
    try {
      const teachers = await repo.listAll();
      return c.json({ teachers });
    } catch (err: any) {
      return c.json({ error: '教員一覧の取得に失敗しました', message: err.message }, 500);
    }
  })
  .post('/api/teachers', zValidator('json', TeacherLoginInputSchema), async (c) => {
    try {
      await verifyTeacher(c);
    } catch (err: any) {
      return c.json({ error: err.message }, 401);
    }

    const { username, password } = c.req.valid('json');
    const repo = c.get('teacherRepo');

    try {
      const exists = await repo.findByUsername(username);
      if (exists) {
        return c.json({ error: 'このユーザー名はすでに登録されています' }, 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();

      await repo.create({
        id,
        username,
        passwordHash,
      });

      return c.json({
        success: true,
        teacher: { id, username }
      }, 201);
    } catch (err: any) {
      return c.json({ error: '教員の登録に失敗しました', message: err.message }, 500);
    }
  })
  .delete('/api/teachers/:id', async (c) => {
    let currentUser;
    try {
      currentUser = await verifyTeacher(c);
    } catch (err: any) {
      return c.json({ error: err.message }, 401);
    }

    const id = c.req.param('id');
    const repo = c.get('teacherRepo');

    try {
      if (currentUser && currentUser.sub === id) {
        return c.json({ error: '現在ログイン中の自分自身のアカウントを削除することはできません' }, 400);
      }

      await repo.delete(id);
      return c.json({ success: true, id });
    } catch (err: any) {
      return c.json({ error: '教員の削除に失敗しました', message: err.message }, 500);
    }
  });

export type AppType = typeof routes;
export default app;
