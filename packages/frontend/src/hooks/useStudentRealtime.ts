import { useState, useEffect, useRef, useCallback } from 'react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface UseStudentRealtimeProps {
  supabase: SupabaseClient | null;
  studentClassroomId: string;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onTeacherReset: () => void;
  onTeacherEvict: (seatId: string) => void;
  onTeacherLockState: (locked: boolean) => void;
  onRoomLayoutUpdated: () => void;
}

export function useStudentRealtime({
  supabase,
  studentClassroomId,
  addToast,
  onTeacherReset,
  onTeacherEvict,
  onTeacherLockState,
  onRoomLayoutUpdated
}: UseStudentRealtimeProps) {
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const studentChannelRef = useRef<RealtimeChannel | null>(null);

  const addToastRef = useRef(addToast);
  const onTeacherResetRef = useRef(onTeacherReset);
  const onTeacherEvictRef = useRef(onTeacherEvict);
  const onTeacherLockStateRef = useRef(onTeacherLockState);
  const onRoomLayoutUpdatedRef = useRef(onRoomLayoutUpdated);

  useEffect(() => { addToastRef.current = addToast; }, [addToast]);
  useEffect(() => { onTeacherResetRef.current = onTeacherReset; }, [onTeacherReset]);
  useEffect(() => { onTeacherEvictRef.current = onTeacherEvict; }, [onTeacherEvict]);
  useEffect(() => { onTeacherLockStateRef.current = onTeacherLockState; }, [onTeacherLockState]);
  useEffect(() => { onRoomLayoutUpdatedRef.current = onRoomLayoutUpdated; }, [onRoomLayoutUpdated]);

  // HTTP Fallback Auto-Polling
  useEffect(() => {
    if (!isFallbackActive || !studentClassroomId) return;

    let timer: any;
    const pollClassroom = async () => {
      try {
        const res = await fetch(`/api/rooms/${studentClassroomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && onRoomLayoutUpdatedRef.current) {
            onRoomLayoutUpdatedRef.current();
          }
        }
      } catch (err) {
        console.warn('HTTP Fallback polling failed:', err);
      }
    };

    timer = setInterval(pollClassroom, 7000);
    return () => clearInterval(timer);
  }, [isFallbackActive, studentClassroomId]);

  // Student Realtime Subscription
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
        onTeacherResetRef.current();
      })
      .on('broadcast', { event: 'student_evicted' }, (response) => {
        if (response.payload && typeof response.payload.seatId === 'string') {
          onTeacherEvictRef.current(response.payload.seatId);
        }
      })
      .on('broadcast', { event: 'teacher_lock_state' }, (response) => {
        if (response.payload && typeof response.payload.locked === 'boolean') {
          onTeacherLockStateRef.current(response.payload.locked);
        }
      })
      .on('broadcast', { event: 'room_layout_updated' }, (response) => {
        onRoomLayoutUpdatedRef.current();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsFallbackActive(false);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Student] Realtime subscription status failed: ${status}. Fallback activated.`);
          setIsFallbackActive(true);
          addToastRef.current('warning', 'リアルタイム接続に失敗しました。教室の接続設定に問題がある可能性があります。教員に確認してください。バックアップの自動同期へ移行しました。');
          setTimeout(() => {
            if (studentChannelRef.current) {
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

  const sendStudentToTeacherBroadcast = useCallback(async (
    seatId: string,
    status: 'ok' | 'ng' | 'none',
    studentName: string,
    studentId: string,
    comment?: string | null,
    responseTime?: number
  ): Promise<'ok' | 'error'> => {
    const channel = studentChannelRef.current;
    if (!channel) return 'error';

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

  return {
    isFallbackActive,
    sendStudentToTeacherBroadcast
  };
}
