import { useState, useEffect, useRef, useCallback } from 'react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeLog, LiveSeatStatus } from '@my-app/shared';
import { seatStatuses as seatStorage, realtimeLogs as logsStorage } from '../lib/storage';

interface UseTeacherRealtimeProps {
  supabase: SupabaseClient | null;
  roomId: string | null;
  isSeatLocked: boolean;
  setLiveStatuses: React.Dispatch<React.SetStateAction<Record<string, LiveSeatStatus>>>;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function useTeacherRealtime({
  supabase,
  roomId,
  isSeatLocked,
  setLiveStatuses,
  addToast
}: UseTeacherRealtimeProps) {
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeLog[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const teacherChannelRef = useRef<RealtimeChannel | null>(null);

  const isSeatLockedRef = useRef(isSeatLocked);
  const roomIdRef = useRef(roomId);
  const addToastRef = useRef(addToast);

  useEffect(() => { isSeatLockedRef.current = isSeatLocked; }, [isSeatLocked]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

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

  // Restore room-specific logs from LocalStorage
  useEffect(() => {
    if (roomId) {
      const saved = logsStorage.get<RealtimeLog[]>(roomId);
      if (saved) {
        setRealtimeLogs(saved);
      } else {
        setRealtimeLogs([]);
      }
    } else {
      setRealtimeLogs([]);
    }
  }, [roomId]);

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
              seatStorage.save(currentRoomId, nextStatuses);
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
              logsStorage.save(currentRoomId, nextLogs);
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
          channel.send({
            type: 'broadcast',
            event: 'teacher_lock_state',
            payload: { locked: isSeatLockedRef.current },
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Teacher] Realtime subscription failed: ${status}. Scheduling auto-reconnect in 10s...`);
          setTimeout(() => {
            if (teacherChannelRef.current) {
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

  const sendTeacherResetBroadcast = useCallback(async (): Promise<'ok' | 'error'> => {
    const channel = teacherChannelRef.current;
    if (!channel) return 'error';

    try {
      const res = await channel.send({
        type: 'broadcast',
        event: 'teacher_reset',
        payload: { timestamp: new Date().toISOString() },
      });
      if (res === 'ok') {
        setRealtimeLogs([]);
        if (roomIdRef.current) {
          logsStorage.remove(roomIdRef.current);
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
    if (!channel) return 'error';

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
    if (!channel) return 'error';

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
    if (!channel) return 'error';

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
    realtimeLogs,
    setRealtimeLogs,
    isOnline,
    sendTeacherResetBroadcast,
    sendStudentEvictedBroadcast,
    sendTeacherLockStateBroadcast,
    sendRoomLayoutUpdatedBroadcast
  };
}
