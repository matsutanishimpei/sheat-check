import { useState, useEffect, useCallback } from 'react';
import { LiveSeatStatus } from '@my-app/shared';

interface UseSeatManagerProps {
  roomId: string | null;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function useSeatManager({ roomId, addToast }: UseSeatManagerProps) {
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveSeatStatus>>({});
  const [isSeatLocked, setIsSeatLocked] = useState(false);

  // Load live statuses from Local Storage on roomId changes
  useEffect(() => {
    if (roomId) {
      const stored = localStorage.getItem(`seat_statuses_room_${roomId}`);
      if (stored) {
        try {
          setLiveStatuses(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to parse saved seat statuses from Local Storage:', err);
        }
      } else {
        setLiveStatuses({});
      }
    } else {
      setLiveStatuses({});
    }
  }, [roomId]);

  // Persist live statuses to Local Storage when updated
  useEffect(() => {
    if (roomId) {
      localStorage.setItem(`seat_statuses_room_${roomId}`, JSON.stringify(liveStatuses));
    }
  }, [liveStatuses, roomId]);

  const removeLiveStatus = useCallback((key: string) => {
    setLiveStatuses((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const bulkResetLiveStatuses = useCallback(() => {
    if (!roomId) {
      addToast('error', '一括リセットを行うには、まず教室データを保存またはロードしてください');
      return false;
    }

    // Preserve student seating registration but reset status, comments, and times
    setLiveStatuses((prev) => {
      const next: Record<string, LiveSeatStatus> = {};
      Object.keys(prev).forEach((seatId) => {
        const current = prev[seatId];
        if (current) {
          next[seatId] = {
            ...current,
            status: 'none',          // Reset to neutral state (gray/blue)
            comment: '',             // Clear comments
            responseTime: undefined, // Wipe response times
          };
        }
      });
      return next;
    });

    addToast('success', '学生の着席は維持したまま、回答状態とコメントをリセットしました。');
    return true;
  }, [roomId, addToast]);

  const toggleSeatLock = useCallback(() => {
    const nextValue = !isSeatLocked;
    setIsSeatLocked(nextValue);
    addToast('info', `座席変更の制限を ${nextValue ? 'ロック(有効)しました' : '解除(無効)しました'}`);
    return nextValue;
  }, [isSeatLocked, addToast]);

  return {
    liveStatuses,
    setLiveStatuses,
    isSeatLocked,
    setIsSeatLocked,
    removeLiveStatus,
    bulkResetLiveStatuses,
    toggleSeatLock,
  };
}
