import { useState, useEffect, useCallback } from 'react';
import { LiveSeatStatus } from '@my-app/shared';
import { seatStatuses as seatStorage } from '../lib/storage';

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
      const stored = seatStorage.get<Record<string, LiveSeatStatus>>(roomId);
      if (stored) {
        setLiveStatuses(stored);
      } else {
        setLiveStatuses({});
      }
    } else {
      setLiveStatuses({});
    }
  }, [roomId]);

  // Persist live statuses to Local Storage when updated (Debounced to prevent performance drops under high traffic)
  useEffect(() => {
    if (!roomId) return;
    const timer = setTimeout(() => {
      seatStorage.save(roomId, liveStatuses);
    }, 1000);
    return () => clearTimeout(timer);
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
