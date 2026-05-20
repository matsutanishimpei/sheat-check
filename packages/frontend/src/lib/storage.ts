/**
 * Centralized localStorage access layer.
 *
 * All localStorage key names and read/write operations are consolidated here
 * to prevent key-name typos, centralize error handling (e.g. Private Window
 * QuotaExceededError), and make the persistence layer mockable for testing.
 */

// ── Safe wrappers ────────────────────────────────────────────────────

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`[storage] Failed to read "${key}":`, e);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[storage] Failed to write "${key}" (Private Window?):`, e);
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[storage] Failed to remove "${key}":`, e);
  }
}

// ── Teacher Auth ─────────────────────────────────────────────────────

export const teacherAuth = {
  isAuthenticated: () => safeGetItem('teacher_auth') === 'true',

  save: (data: { token: string; supabaseToken: string; teacher: object }) => {
    safeSetItem('teacher_jwt', data.token);
    safeSetItem('supabase_teacher_token', data.supabaseToken);
    safeSetItem('logged_in_teacher', JSON.stringify(data.teacher));
    safeSetItem('teacher_auth', 'true');
  },

  clear: () => {
    safeRemoveItem('teacher_jwt');
    safeRemoveItem('supabase_teacher_token');
    safeRemoveItem('logged_in_teacher');
    safeRemoveItem('teacher_auth');
  },

  getJwt: () => safeGetItem('teacher_jwt'),
  getSupabaseToken: () => safeGetItem('supabase_teacher_token') || '',
  getLoggedInTeacher: (): { id: string; username: string } | null => {
    try {
      const raw = safeGetItem('logged_in_teacher');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

// ── Supabase Config ──────────────────────────────────────────────────

export const supabaseConfig = {
  getUrl: () => safeGetItem('sb_url') || '',
  getKey: () => safeGetItem('sb_key') || '',

  save: (url: string, key: string) => {
    safeSetItem('sb_url', url);
    safeSetItem('sb_key', key);
  },
};

// ── Active Teacher Room ──────────────────────────────────────────────

export const activeRoom = {
  getId: () => safeGetItem('active_teacher_room_id'),
  save: (id: string) => safeSetItem('active_teacher_room_id', id),
  clear: () => safeRemoveItem('active_teacher_room_id'),
};

// ── Seat Statuses (per room) ─────────────────────────────────────────

export const seatStatuses = {
  get: <T = unknown>(roomId: string): T | null => {
    const raw = safeGetItem(`seat_statuses_room_${roomId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  save: (roomId: string, data: unknown) => {
    safeSetItem(`seat_statuses_room_${roomId}`, JSON.stringify(data));
  },

  remove: (roomId: string) => {
    safeRemoveItem(`seat_statuses_room_${roomId}`);
  },
};

// ── Realtime Logs (per room) ─────────────────────────────────────────

export const realtimeLogs = {
  get: <T = unknown>(roomId: string): T | null => {
    const raw = safeGetItem(`realtime_logs_room_${roomId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  save: (roomId: string, data: unknown) => {
    safeSetItem(`realtime_logs_room_${roomId}`, JSON.stringify(data));
  },

  remove: (roomId: string) => {
    safeRemoveItem(`realtime_logs_room_${roomId}`);
  },
};

// ── Response Archive (per room) ──────────────────────────────────────

export const responseArchive = {
  get: <T = unknown>(roomId: string): T | null => {
    const raw = safeGetItem(`class_responses_room_${roomId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  save: (roomId: string, data: unknown) => {
    safeSetItem(`class_responses_room_${roomId}`, JSON.stringify(data));
  },

  remove: (roomId: string) => {
    safeRemoveItem(`class_responses_room_${roomId}`);
  },

  getDate: (roomId: string) => safeGetItem(`class_responses_date_room_${roomId}`),
  saveDate: (roomId: string) => safeSetItem(`class_responses_date_room_${roomId}`, new Date().toDateString()),
  removeDate: (roomId: string) => safeRemoveItem(`class_responses_date_room_${roomId}`),
};

// ── Student Session (per room) ───────────────────────────────────────

export const studentSession = {
  getId: (roomId: string) => safeGetItem(`student_id_${roomId}`),
  getName: (roomId: string) => safeGetItem(`student_name_${roomId}`),
  getSeatId: (roomId: string) => safeGetItem(`student_seat_id_${roomId}`),
  getPrevSeatId: (roomId: string) => safeGetItem(`student_prev_seat_id_${roomId}`),
  getToken: () => safeGetItem('supabase_student_token') || '',
  getLastRoomId: () => safeGetItem('last_room_id'),

  saveId: (roomId: string, studentId: string) => safeSetItem(`student_id_${roomId}`, studentId),
  saveName: (roomId: string, name: string) => safeSetItem(`student_name_${roomId}`, name),
  saveSeatId: (roomId: string, seatId: string) => safeSetItem(`student_seat_id_${roomId}`, seatId),
  savePrevSeatId: (roomId: string, seatId: string) => safeSetItem(`student_prev_seat_id_${roomId}`, seatId),
  saveToken: (token: string) => safeSetItem('supabase_student_token', token),
  saveLastRoomId: (roomId: string) => safeSetItem('last_room_id', roomId),

  removeSeatId: (roomId: string) => safeRemoveItem(`student_seat_id_${roomId}`),
};
