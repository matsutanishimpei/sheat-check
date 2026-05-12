import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import app from './index';
import { InMemoryRoomRepository } from './repositories/InMemoryRoomRepository';
import { InMemoryTeacherRepository } from './repositories/InMemoryTeacherRepository';

describe('Backend API (Dependency Injection & Repository Pattern) Tests', () => {
  let mockRepo: InMemoryRoomRepository;
  let mockTeacherRepo: InMemoryTeacherRepository;
  let testApp: Hono<any, any, any>;

  beforeEach(() => {
    // 1. Setup in-memory repositories with default seed data
    mockRepo = new InMemoryRoomRepository([
      {
        id: 'test-room-uuid-1',
        name: '物理実験室',
        grid: [{ x: 1, y: 1, type: 'student' }],
        supabaseUrl: 'https://test-sb-1.supabase.co',
        supabaseAnonKey: 'test-sb-key-1',
        isActive: true,
      }
    ]);

    mockTeacherRepo = new InMemoryTeacherRepository();

    // 2. Setup a test Hono application that prepends repositories injection middleware
    testApp = new Hono();
    testApp.use('*', async (c, next) => {
      c.set('roomRepo', mockRepo);
      c.set('teacherRepo', mockTeacherRepo);
      await next();
    });
    
    // Mount the original production app routes
    testApp.route('/', app);
  });

  it('GET /api/hello - should return greeting message', async () => {
    const res = await testApp.request('/api/hello');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body).toEqual({ message: 'Hello Hono!' });
  });

  it('GET /api/rooms - should list all registered classrooms', async () => {
    const res = await testApp.request('/api/rooms');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.rooms).toHaveLength(1);
    expect(body.rooms[0].name).toBe('物理実験室');
    expect(body.rooms[0].id).toBe('test-room-uuid-1');
  });

  it('GET /api/rooms/:id - should fetch existing classroom layout details', async () => {
    const res = await testApp.request('/api/rooms/test-room-uuid-1');
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.name).toBe('物理実験室');
    expect(body.grid).toEqual([{ x: 1, y: 1, type: 'student' }]);
    expect(body.supabaseUrl).toBe('https://test-sb-1.supabase.co');
  });

  it('GET /api/rooms/:id - should return 404 for non-existing uuid', async () => {
    const res = await testApp.request('/api/rooms/non-existent-uuid');
    expect(res.status).toBe(404);
    const body: any = await res.json();
    expect(body.error).toBe('Room not found');
  });

  it('POST /api/rooms - should successfully create a new room layout', async () => {
    const newRoomPayload = {
      name: '化学講義室',
      grid: [{ x: 2, y: 2, type: 'student' }, { x: 0, y: 0, type: 'teacher' }],
      supabaseUrl: 'https://test-sb-2.supabase.co',
      supabaseAnonKey: 'test-sb-key-2',
      isActive: true,
    };

    const res = await testApp.request(
      '/api/rooms',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoomPayload),
      }
    );

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('化学講義室');
    expect(body.grid).toEqual(newRoomPayload.grid);
    expect(body.isActive).toBe(true);

    // Verify room is inserted into Repository (In-Memory)
    expect(mockRepo.roomsTable).toHaveLength(2);
    expect(mockRepo.roomsTable.some(r => r.name === '化学講義室')).toBe(true);
  });

  it('PUT /api/rooms/:id - should update existing classroom layout details', async () => {
    const updatedPayload = {
      name: '更新された物理実験室',
      grid: [{ x: 3, y: 3, type: 'student' }],
      supabaseUrl: 'https://updated-sb.supabase.co',
      supabaseAnonKey: 'updated-sb-key',
      isActive: false,
    };

    const res = await testApp.request(
      '/api/rooms/test-room-uuid-1',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      }
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.name).toBe('更新された物理実験室');
    expect(body.isActive).toBe(false);

    // Verify repository update
    const updatedRoom = mockRepo.roomsTable.find(r => r.id === 'test-room-uuid-1');
    expect(updatedRoom?.name).toBe('更新された物理実験室');
    expect(updatedRoom?.isActive).toBe(false);
  });

  it('PATCH /api/rooms/:id/status - should toggle classroom status between active/inactive', async () => {
    const res = await testApp.request(
      '/api/rooms/test-room-uuid-1/status',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      }
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.isActive).toBe(false);

    // Verify status in Repository
    const updatedRoom = mockRepo.roomsTable.find(r => r.id === 'test-room-uuid-1');
    expect(updatedRoom?.isActive).toBe(false);
  });

  it('DELETE /api/rooms/:id - should physically delete existing room layout', async () => {
    const res = await testApp.request(
      '/api/rooms/test-room-uuid-1',
      {
        method: 'DELETE',
      }
    );

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.id).toBe('test-room-uuid-1');

    // Verify physical deletion from Repository
    expect(mockRepo.roomsTable).toHaveLength(0);
  });

  describe('Teacher Authentication Endpoints', () => {
    it('POST /api/auth/teacher/login - should log in successfully with correct credentials', async () => {
      const payload = {
        username: 'teacher_admin',
        password: 'admin123'
      };

      const res = await testApp.request('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.token).toBeDefined();
      expect(body.supabaseToken).toBeDefined();
      expect(body.teacher.username).toBe('teacher_admin');
    });

    it('POST /api/auth/teacher/login - should fail with incorrect password', async () => {
      const payload = {
        username: 'teacher_admin',
        password: 'wrong_password'
      };

      const res = await testApp.request('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.error).toContain('ユーザー名またはパスワードが正しくありません');
    });

    it('POST /api/auth/teacher/login - should fail with non-existing username', async () => {
      const payload = {
        username: 'non_existent_teacher',
        password: 'password123'
      };

      const res = await testApp.request('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.error).toContain('ユーザー名またはパスワードが正しくありません');
    });
  });

  describe('Student Token Issuance Endpoints (Approach B)', () => {
    it('POST /api/rooms/:id/student-token - should issue a student Supabase token for an existing room', async () => {
      const payload = {
        studentId: 'STU001',
        name: '田中太郎'
      };

      const res = await testApp.request('/api/rooms/test-room-uuid-1/student-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.supabaseToken).toBeDefined();
      expect(body.studentId).toBe('STU001');
      expect(body.name).toBe('田中太郎');
      expect(body.roomId).toBe('test-room-uuid-1');
    });

    it('POST /api/rooms/:id/student-token - should fail to issue a token for a non-existing room', async () => {
      const payload = {
        studentId: 'STU001',
        name: '田中太郎'
      };

      const res = await testApp.request('/api/rooms/invalid-room-uuid/student-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(404);
      const body: any = await res.json();
      expect(body.error).toContain('指定された教室が見つかりません');
    });
  });

  describe('Teacher Account CRUD Endpoints', () => {
    let teacherToken: string;
    let teacherAdminId: string;

    beforeEach(async () => {
      // Login to get a valid teacher JWT token
      const res = await testApp.request('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'teacher_admin', password: 'admin123' })
      });
      const body: any = await res.json();
      teacherToken = body.token;
      
      // Look up teacher_admin UUID inside the repo
      const teacher = await mockTeacherRepo.findByUsername('teacher_admin');
      teacherAdminId = teacher ? teacher.id : '';
    });

    it('GET /api/teachers - should return 401 without Bearer token', async () => {
      const res = await testApp.request('/api/teachers');
      expect(res.status).toBe(401);
      const body: any = await res.json();
      expect(body.error).toContain('認証トークンが見つかりません');
    });

    it('GET /api/teachers - should fetch all teachers with a valid token', async () => {
      const res = await testApp.request('/api/teachers', {
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.teachers).toBeDefined();
      expect(body.teachers.length).toBe(1);
      expect(body.teachers[0].username).toBe('teacher_admin');
      expect(body.teachers[0].passwordHash).toBeUndefined(); // Should omit password hashes
    });

    it('POST /api/teachers - should successfully register a new teacher', async () => {
      const payload = {
        username: 'new_teacher',
        password: 'secure_password_123'
      };

      const res = await testApp.request('/api/teachers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.teacher.id).toBeDefined();
      expect(body.teacher.username).toBe('new_teacher');

      // Verify insertion in repository
      const created = await mockTeacherRepo.findByUsername('new_teacher');
      expect(created).toBeDefined();
      expect(created?.username).toBe('new_teacher');
    });

    it('POST /api/teachers - should fail to register duplicate teacher names', async () => {
      const payload = {
        username: 'teacher_admin',
        password: 'different_password_123'
      };

      const res = await testApp.request('/api/teachers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error).toContain('このユーザー名はすでに登録されています');
    });

    it('DELETE /api/teachers/:id - should fail to delete self-account', async () => {
      const res = await testApp.request(`/api/teachers/${teacherAdminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });

      expect(res.status).toBe(400);
      const body: any = await res.json();
      expect(body.error).toContain('自分自身のアカウントを削除することはできません');
    });

    it('DELETE /api/teachers/:id - should delete a different teacher successfully', async () => {
      // 1. Create a dummy teacher using helper method
      mockTeacherRepo.addTeacher({
        id: 'dummy-teacher-uuid',
        username: 'dummy_teacher',
        passwordHash: 'dummy_hash',
        createdAt: new Date().toISOString()
      });

      // 2. Perform deletion
      const res = await testApp.request('/api/teachers/dummy-teacher-uuid', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${teacherToken}` }
      });

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.id).toBe('dummy-teacher-uuid');

      // Verify deletion from repository
      const deleted = await mockTeacherRepo.findByUsername('dummy_teacher');
      expect(deleted).toBeNull();
    });
  });
});
