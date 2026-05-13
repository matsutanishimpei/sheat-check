import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeLog, LiveSeatStatus } from '@my-app/shared';

interface UseRealtimeSessionProps {
  roomId: string | null;
  studentClassroomId: string;
  isSeatLocked: boolean;
  setLiveStatuses: React.Dispatch<React.SetStateAction<Record<string, LiveSeatStatus>>>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onTeacherReset: () => void;
  onTeacherEvict?: (seatId: string) => void;
  onTeacherLockState: (locked: boolean) => void;
  onRoomLayoutUpdated?: () => void;
  supabaseUrl: string;
  setSupabaseUrl: (val: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (val: string) => void;
  authToken?: string;
}

export function useRealtimeSession({
  roomId,
  studentClassroomId,
  isSeatLocked,
  setLiveStatuses,
  addToast,
  onTeacherReset,
  onTeacherEvict,
  onTeacherLockState,
  onRoomLayoutUpdated,
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  authToken,
}: UseRealtimeSessionProps) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(() => {
    const url = localStorage.getItem('sb_url');
    const key = localStorage.getItem('sb_key');
    if (url && key) {
      try {
        return createClient(url.trim(), key.trim());
      } catch (err) {
        console.error('Supabase initialization failed:', err);
      }
    }
    return null;
  });

  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeLog[]>([]);

  // Restore room-specific logs from LocalStorage on mount or when roomId changes
  useEffect(() => {
    if (roomId) {
      const saved = localStorage.getItem(`realtime_logs_room_${roomId}`);
      if (saved) {
        try {
          setRealtimeLogs(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved realtime logs:', e);
          setRealtimeLogs([]);
        }
      } else {
        setRealtimeLogs([]);
      }
    } else {
      setRealtimeLogs([]);
    }
  }, [roomId]);

  const [isOnline, setIsOnline] = useState(true);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  // ── HTTP Fallback Auto-Polling ──────────────────────────────────
  // If Supabase limits are reached, poll classroom status from backend every 7 seconds
  useEffect(() => {
    if (!isFallbackActive || !studentClassroomId) return;

    let timer: any;

    const pollClassroom = async () => {
      try {
        const res = await fetch(`/api/rooms/${studentClassroomId}`);
        if (res.ok) {
          const data = await res.json();
          // Trigger layout layout re-renders automatically
          if (data && onRoomLayoutUpdatedRef.current) {
            onRoomLayoutUpdatedRef.current();
          }
        }
      } catch (err) {
        console.warn('HTTP Fallback polling failed:', err);
      }
    };

    timer = setInterval(pollClassroom, 7000); // Poll every 7 seconds

    return () => {
      clearInterval(timer);
    };
  }, [isFallbackActive, studentClassroomId]);

  // Dynamically re-initialize Supabase client when credentials update
  useEffect(() => {
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();

    if (trimmedUrl && trimmedKey) {
      try {
        const client = createClient(trimmedUrl, trimmedKey);
        setSupabase(client);
        
        try {
          localStorage.setItem('sb_url', trimmedUrl);
          localStorage.setItem('sb_key', trimmedKey);
        } catch (storageErr) {
          console.warn('Failed to save Supabase config to localStorage (Private Window?):', storageErr);
        }
      } catch (err) {
        console.error('Dynamic Supabase re-initialization failed:', err);
        setSupabase(null);
      }
    } else {
      setSupabase(null);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  const teacherChannelRef = useRef<RealtimeChannel | null>(null);
  const studentChannelRef = useRef<RealtimeChannel | null>(null);

  // ── Stable callback refs ──────────────────────────────────────────
  // These refs always point to the latest callback without causing
  // useEffect re-runs. This is the standard React pattern for
  // "latest value without re-subscribing".
  const addToastRef = useRef(addToast);
  const onTeacherResetRef = useRef(onTeacherReset);
  const onTeacherEvictRef = useRef(onTeacherEvict);
  const onTeacherLockStateRef = useRef(onTeacherLockState);
  const onRoomLayoutUpdatedRef = useRef(onRoomLayoutUpdated);
  const isSeatLockedRef = useRef(isSeatLocked);
  const roomIdRef = useRef(roomId);

  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  useEffect(() => { onTeacherResetRef.current = onTeacherReset; }, [onTeacherReset]);
  useEffect(() => { onTeacherEvictRef.current = onTeacherEvict; }, [onTeacherEvict]);
  useEffect(() => { onTeacherLockStateRef.current = onTeacherLockState; }, [onTeacherLockState]);
  useEffect(() => { onRoomLayoutUpdatedRef.current = onRoomLayoutUpdated; }, [onRoomLayoutUpdated]);
  useEffect(() => { isSeatLockedRef.current = isSeatLocked; }, [isSeatLocked]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  // Initialize/Update Supabase client
  const saveSupabaseConfig = useCallback(() => {
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();
    
    if (!trimmedUrl || !trimmedKey) {
      addToastRef.current('error', 'Supabase URL と Anon Key を両方とも入力してください');
      return;
    }
    try {
      const client = createClient(trimmedUrl, trimmedKey);
      setSupabase(client);
      
      try {
        localStorage.setItem('sb_url', trimmedUrl);
        localStorage.setItem('sb_key', trimmedKey);
      } catch (storageErr) {
        console.warn('Failed to save to localStorage:', storageErr);
      }
      
      if (!roomIdRef.current) {
        addToastRef.current('success', '接続設定をローカルに保持しました！次に、右上の「D1 に保存」で教室を新規登録してください。');
      } else {
        addToastRef.current('success', '接続設定をローカルに保持しました！');
      }
    } catch (err: any) {
      addToastRef.current('error', `接続設定エラー: ${err.message}`);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  // Reconnect logic or connection validation
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToastRef.current('success', 'ネットワークに再接続しました');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToastRef.current('error', 'ネットワーク接続が切れました。オフライン動作中...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Teacher Realtime Subscription ─────────────────────────────────
  // Dependencies: only supabase client instance and roomId.
  // isSeatLocked / addToast are accessed via refs to avoid re-subscribing.
  useEffect(() => {
    if (teacherChannelRef.current) {
      teacherChannelRef.current.unsubscribe();
      teacherChannelRef.current = null;
    }

    if (!supabase || !roomId) return;

    addToastRef.current('info', `Supabase チャンネル「${roomId}」を購読中...`);

    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'student_to_teacher' }, (response) => {
        console.log('Received student broadcast:', response);

        const payload = response.payload;
        if (payload && payload.seatId && payload.status) {
          const currentRoomId = roomIdRef.current;

          setLiveStatuses((prev) => {
            const nextStatuses = { ...prev };
            if (payload.status === 'none') {
              delete nextStatuses[payload.seatId];
            } else {
              nextStatuses[payload.seatId] = {
                status: payload.status,
                name: payload.studentName || '匿名',
                studentId: payload.studentId || '不明',
                responseTime: typeof payload.responseTime === 'number' ? payload.responseTime : undefined,
                comment: payload.comment || undefined,
              };
            }
            if (currentRoomId) {
              localStorage.setItem(`seat_statuses_room_${currentRoomId}`, JSON.stringify(nextStatuses));
            }
            return nextStatuses;
          });

          const logItem: RealtimeLog = {
            id: crypto.randomUUID(),
            studentName: payload.studentName || '匿名',
            studentId: payload.studentId || '不明',
            responseTime: typeof payload.responseTime === 'number' ? payload.responseTime : undefined,
            seatId: payload.seatId,
            status: payload.status,
            comment: payload.comment || undefined,
            timestamp: new Date().toLocaleTimeString(),
          };
          setRealtimeLogs((prev) => {
            const nextLogs = [logItem, ...prev].slice(0, 50);
            if (currentRoomId) {
              localStorage.setItem(`realtime_logs_room_${currentRoomId}`, JSON.stringify(nextLogs));
            }
            return nextLogs;
          });

          if (payload.status === 'none') {
            addToastRef.current('info', `座席解除: ${logItem.studentName} さんが座席 ${logItem.seatId} を解放しました`);
          } else {
            addToastRef.current('success', `リアルタイム受信: ${logItem.studentName} さん (座席: ${logItem.seatId}) ➔ ${payload.status.toUpperCase()}`);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Teacher] Successfully subscribed to channel: ${roomId}`);
          // Broadcast current lock state to any students already connected
          channel.send({
            type: 'broadcast',
            event: 'teacher_lock_state',
            payload: { locked: isSeatLockedRef.current },
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Teacher] Realtime subscription failed: ${status}. Scheduling auto-reconnect in 10s...`);
          setTimeout(() => {
            if (teacherChannelRef.current) {
              console.log('[Teacher] Retrying subscription to channel:', roomId);
              teacherChannelRef.current.subscribe();
            }
          }, 10000);
        }
      });

    teacherChannelRef.current = channel;

    return () => {
      if (teacherChannelRef.current) {
        teacherChannelRef.current.unsubscribe();
        teacherChannelRef.current = null;
      }
    };
  }, [supabase, roomId, setLiveStatuses]);
  // ⚠️  setLiveStatuses is a React setState – stable reference.
  //     addToast / isSeatLocked are accessed through refs – NOT in deps.

  // ── Student Realtime Subscription ─────────────────────────────────
  useEffect(() => {
    if (studentChannelRef.current) {
      studentChannelRef.current.unsubscribe();
      studentChannelRef.current = null;
    }

    if (!supabase || !studentClassroomId.trim()) return;

    const channel = supabase.channel(`room:${studentClassroomId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'teacher_reset' }, (response) => {
        console.log('Received reset event from teacher:', response);
        onTeacherResetRef.current();
      })
      .on('broadcast', { event: 'student_evicted' }, (response) => {
        console.log('Received eviction event from teacher:', response);
        if (response.payload && typeof response.payload.seatId === 'string') {
          if (onTeacherEvictRef.current) {
            onTeacherEvictRef.current(response.payload.seatId);
          }
        }
      })
      .on('broadcast', { event: 'teacher_lock_state' }, (response) => {
        console.log('Received seat lock state from teacher:', response);
        if (response.payload && typeof response.payload.locked === 'boolean') {
          onTeacherLockStateRef.current(response.payload.locked);
        }
      })
      .on('broadcast', { event: 'room_layout_updated' }, (response) => {
        console.log('Received room layout update event from teacher:', response);
        if (onRoomLayoutUpdatedRef.current) {
          onRoomLayoutUpdatedRef.current();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Student] Successfully subscribed to channel: ${studentClassroomId}`);
          setIsFallbackActive(false);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Student] Realtime subscription status failed: ${status}. Fallback activated. Scheduling auto-reconnect in 10s...`);
          setIsFallbackActive(true);
          addToastRef.current('warning', '大教室での接続上限、または通信不通により、リアルタイム同期が制限されています。バックアップのHTTP自動同期（自動ポーリング）に自動切り替えしました。');
          setTimeout(() => {
            if (studentChannelRef.current) {
              console.log('[Student] Retrying subscription to channel:', studentClassroomId);
              studentChannelRef.current.subscribe();
            }
          }, 10000);
        }
      });

    studentChannelRef.current = channel;

    return () => {
      if (studentChannelRef.current) {
        studentChannelRef.current.unsubscribe();
        studentChannelRef.current = null;
      }
    };
  }, [supabase, studentClassroomId]);
  // ⚠️  onTeacherReset / onTeacherLockState are accessed through refs – NOT in deps.

  // ── Send helpers ──────────────────────────────────────────────────

  const sendStudentToTeacherBroadcast = useCallback(async (
    seatId: string,
    status: 'ok' | 'ng' | 'none',
    studentName: string,
    studentId: string,
    comment?: string | null,
    responseTime?: number
  ): Promise<'ok' | 'error'> => {
    const channel = studentChannelRef.current;
    if (!channel) {
      console.error('[sendStudentToTeacherBroadcast] No student channel available');
      return 'error';
    }

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'student_to_teacher',
        payload: {
          seatId,
          status,
          studentName,
          studentId,
          comment: comment || null,
          responseTime,
          updatedAt: new Date().toISOString(),
        },
      });
      return res === 'ok' ? 'ok' : 'error';
    } catch (err) {
      console.error('Failed to send student broadcast:', err);
      return 'error';
    }
  }, []);

  const sendTeacherResetBroadcast = useCallback(async (): Promise<'ok' | 'error'> => {
    const channel = teacherChannelRef.current;
    if (!channel) {
      console.error('[sendTeacherResetBroadcast] No teacher channel available');
      return 'error';
    }

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'teacher_reset',
        payload: { timestamp: new Date().toISOString() },
      });
      if (res === 'ok') {
        setRealtimeLogs([]);
        if (roomIdRef.current) {
          localStorage.removeItem(`realtime_logs_room_${roomIdRef.current}`);
        }
      }
      return res === 'ok' ? 'ok' : 'error';
    } catch (err) {
      console.error('Failed to send teacher reset:', err);
      return 'error';
    }
  }, []);

  const sendStudentEvictedBroadcast = useCallback(async (seatId: string): Promise<'ok' | 'error'> => {
    const channel = teacherChannelRef.current;
    if (!channel) {
      console.error('[sendStudentEvictedBroadcast] No teacher channel available');
      return 'error';
    }

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'student_evicted',
        payload: { seatId, timestamp: new Date().toISOString() },
      });
      return res === 'ok' ? 'ok' : 'error';
    } catch (err) {
      console.error('Failed to send student evicted broadcast:', err);
      return 'error';
    }
  }, []);

  const sendTeacherLockStateBroadcast = useCallback(async (locked: boolean): Promise<'ok' | 'error'> => {
    const channel = teacherChannelRef.current;
    if (!channel) {
      console.error('[sendTeacherLockStateBroadcast] No teacher channel available');
      return 'error';
    }

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'teacher_lock_state',
        payload: { locked },
      });
      return res === 'ok' ? 'ok' : 'error';
    } catch (err) {
      console.error('Failed to send teacher lock state:', err);
      return 'error';
    }
  }, []);

  const sendRoomLayoutUpdatedBroadcast = useCallback(async (): Promise<'ok' | 'error'> => {
    const channel = teacherChannelRef.current;
    if (!channel) {
      console.error('[sendRoomLayoutUpdatedBroadcast] No teacher channel available');
      return 'error';
    }

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'room_layout_updated',
        payload: { timestamp: new Date().toISOString() },
      });
      return res === 'ok' ? 'ok' : 'error';
    } catch (err) {
      console.error('Failed to send room layout updated broadcast:', err);
      return 'error';
    }
  }, []);

  return {
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
    supabase,
    saveSupabaseConfig,
    realtimeLogs,
    setRealtimeLogs,
    isOnline,
    isFallbackActive,
    sendStudentToTeacherBroadcast,
    sendTeacherResetBroadcast,
    sendStudentEvictedBroadcast,
    sendTeacherLockStateBroadcast,
    sendRoomLayoutUpdatedBroadcast,
  };
}
