import { useCallback } from 'react';
import { LiveSeatStatus } from '@my-app/shared';
import { generateCSVContent } from '../lib/csvHelper';
import { useToast } from '../contexts/ToastContext';
import { responseArchive } from '../lib/storage';

/**
 * Manages the archiving and CSV export of student response data.
 *
 * Extracted from TeacherMonitorPage to isolate the localStorage-based
 * question session history logic from the page component.
 */
export function useResponseArchive(
  roomId: string | null,
  roomName: string,
  liveStatuses: Record<string, LiveSeatStatus>
) {
  const { addToast } = useToast();

  /** Archive current live statuses as a timestamped question session */
  const archiveCurrentStatuses = useCallback(() => {
    if (!roomId) return;

    const currentResponses: Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }> = {};
    let hasData = false;

    Object.keys(liveStatuses).forEach((seatId) => {
      const live = liveStatuses[seatId];
      if (live && live.studentId && live.status && live.status !== 'none') {
        currentResponses[live.studentId] = {
          name: live.name,
          status: live.status as 'ok' | 'ng',
          responseTime: live.responseTime,
          comment: live.comment || undefined,
        };
        hasData = true;
      }
    });

    if (!hasData) return;

    const timeLabel = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sessionKey = `質問_${timeLabel}`;

    let saved: Record<string, any> = responseArchive.get<Record<string, any>>(roomId) || {};

    saved[sessionKey] = currentResponses;
    responseArchive.save(roomId, saved);
    responseArchive.saveDate(roomId);
  }, [roomId, liveStatuses]);

  /** Export all archived + current responses as a CSV download */
  const handleExportCSV = useCallback(() => {
    if (!roomId) return;

    let saved: Record<string, Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }>> = 
      responseArchive.get(roomId) || {};

    // Include current in-progress responses
    const currentResponses: Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }> = {};
    let hasCurrent = false;
    Object.keys(liveStatuses).forEach((seatId) => {
      const live = liveStatuses[seatId];
      if (live && live.studentId && live.status && live.status !== 'none') {
        currentResponses[live.studentId] = {
          name: live.name,
          status: live.status as 'ok' | 'ng',
          responseTime: live.responseTime,
          comment: live.comment || undefined,
        };
        hasCurrent = true;
      }
    });

    const finalSessions = { ...saved };
    if (hasCurrent) {
      finalSessions['現在進行中'] = currentResponses;
    }

    const sessionKeys = Object.keys(finalSessions);
    if (sessionKeys.length === 0) {
      addToast('warning', '出力する回答データがありません。');
      return;
    }

    // Aggregate all students
    const studentMap: Record<string, { name: string; responses: Record<string, any> }> = {};
    sessionKeys.forEach((sKey) => {
      const sessionData = finalSessions[sKey];
      Object.keys(sessionData).forEach((studentId) => {
        const resp = sessionData[studentId];
        if (!studentMap[studentId]) {
          studentMap[studentId] = { name: resp.name, responses: {} };
        }
        studentMap[studentId].responses[sKey] = resp;
      });
    });

    const studentIds = Object.keys(studentMap).sort();
    if (studentIds.length === 0) {
      addToast('warning', '出力する回答データがありません。');
      return;
    }

    const csvContent = generateCSVContent(sessionKeys, studentMap);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
    link.setAttribute('download', `回答ログ_${roomName || '教室'}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', '回答ログ（CSV）をダウンロードしました！');
  }, [roomId, liveStatuses, roomName, addToast]);

  /** Clear all saved question history for this room */
  const handleClearSavedResponses = useCallback(() => {
    if (!roomId) return;
    if (window.confirm('これまでに保存された本日のすべての質問履歴をクリアしますか？\n（現在の座席上のステータスはリセットされません）')) {
      responseArchive.remove(roomId);
      addToast('success', '質問履歴をクリアしました。');
    }
  }, [roomId, addToast]);

  return {
    archiveCurrentStatuses,
    handleExportCSV,
    handleClearSavedResponses,
  };
}
