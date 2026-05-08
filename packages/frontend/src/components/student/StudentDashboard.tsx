import React from 'react';
import { Heart, User, Lock, AlertTriangle, Unlock } from 'lucide-react';

interface StudentDashboardProps {
  studentName: string;
  studentSeatId: string;
  studentComment: string;
  setStudentComment: (val: string) => void;
  studentLiveSeatLocked: boolean;
  onSendBroadcast: (status: 'ok' | 'ng') => void;
  onChangeSeat: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = React.memo(({
  studentName,
  studentSeatId,
  studentComment,
  setStudentComment,
  studentLiveSeatLocked,
  onSendBroadcast,
  onChangeSeat,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="student-title-group">
        <h2 className="student-title">
          <Heart size={24} style={{ color: 'var(--color-obstacle)' }} /> 固定席理解度ポータル
        </h2>
        <p className="student-subtitle">あなたの状態を教員にリアルタイム送信します</p>
      </div>

      {/* Fixed seat details summary */}
      <div style={{ background: 'var(--bg-deep)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--color-student)' }} />
          <span style={{ fontWeight: 600 }}>{studentName} さん</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>登録席:</span>
          <strong style={{ color: 'var(--color-student)', fontSize: '1rem' }}>({studentSeatId})</strong>
        </div>
      </div>

      {studentLiveSeatLocked && (
        <div className="lock-banner" style={{ marginTop: '0' }}>
          <Lock size={14} />
          <span>教員によって座席の変更がロックされています</span>
        </div>
      )}

      <div className="input-group">
        <label className="input-label">コメント (任意)</label>
        <input
          type="text"
          className="text-input"
          placeholder="例: ここがわかりません、等"
          value={studentComment}
          onChange={(e) => setStudentComment(e.target.value)}
        />
      </div>

      {/* Main giant OK / NG buttons */}
      <div className="action-buttons-grid">
        <button
          onClick={() => onSendBroadcast('ok')}
          className="btn-huge btn-ok"
        >
          <Heart size={36} />
          <span>了解 (OK)</span>
        </button>
        <button
          onClick={() => onSendBroadcast('ng')}
          className="btn-huge btn-ng"
        >
          <AlertTriangle size={36} />
          <span>不調 (NG)</span>
        </button>
      </div>

      {/* Change seat fallback (Only active when Teacher's seatLock is false!) */}
      <button
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
        onClick={onChangeSeat}
        disabled={studentLiveSeatLocked}
        title={studentLiveSeatLocked ? '教員により変更がロックされています' : undefined}
      >
        <Unlock size={14} /> 席の変更 (Change Seat)
      </button>
    </div>
  );
});

StudentDashboard.displayName = 'StudentDashboard';
