// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { teacherAuth, supabaseConfig, activeRoom } from './storage';

describe('Storage Layer Abstraction', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('teacherAuth helper', () => {
    it('should initially return isAuthenticated = false', () => {
      expect(teacherAuth.isAuthenticated()).toBe(false);
      expect(teacherAuth.getJwt()).toBeNull();
      expect(teacherAuth.getLoggedInTeacher()).toBeNull();
    });

    it('should correctly save, load, and clear teacher credentials', () => {
      const mockTeacher = { id: 'teacher-1', username: 'admin' };
      teacherAuth.save({
        token: 'mock-jwt-token',
        supabaseToken: 'mock-sb-token',
        teacher: mockTeacher,
      });

      expect(teacherAuth.isAuthenticated()).toBe(true);
      expect(teacherAuth.getJwt()).toBe('mock-jwt-token');
      expect(teacherAuth.getSupabaseToken()).toBe('mock-sb-token');
      expect(teacherAuth.getLoggedInTeacher()).toEqual(mockTeacher);

      teacherAuth.clear();
      expect(teacherAuth.isAuthenticated()).toBe(false);
      expect(teacherAuth.getJwt()).toBeNull();
      expect(teacherAuth.getSupabaseToken()).toBe('');
      expect(teacherAuth.getLoggedInTeacher()).toBeNull();
    });
  });

  describe('supabaseConfig helper', () => {
    it('should correctly store and read supabase connection options', () => {
      expect(supabaseConfig.getUrl()).toBe('');
      expect(supabaseConfig.getKey()).toBe('');

      supabaseConfig.save('https://my-project.supabase.co', 'anon-key-abc');
      expect(supabaseConfig.getUrl()).toBe('https://my-project.supabase.co');
      expect(supabaseConfig.getKey()).toBe('anon-key-abc');
    });
  });

  describe('activeRoom helper', () => {
    it('should manage currently managed active room id', () => {
      expect(activeRoom.getId()).toBeNull();

      activeRoom.save('room-xyz');
      expect(activeRoom.getId()).toBe('room-xyz');

      activeRoom.clear();
      expect(activeRoom.getId()).toBeNull();
    });
  });
});
