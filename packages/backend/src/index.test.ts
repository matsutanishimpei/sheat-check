import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import app from './index';
import { InMemoryRoomRepository } from './repositories/InMemoryRoomRepository';

describe('Backend API (Dependency Injection & Repository Pattern) Tests', () => {
  let mockRepo: InMemoryRoomRepository;
  let testApp: Hono<any, any, any>;

  beforeEach(() => {
    // 1. Setup in-memory repository with default seed data
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

    // 2. Setup a test Hono application that prepends a repository injection middleware
    testApp = new Hono();
    testApp.use('*', async (c, next) => {
      c.set('roomRepo', mockRepo);
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
});
