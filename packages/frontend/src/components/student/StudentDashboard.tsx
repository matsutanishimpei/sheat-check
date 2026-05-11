import React from 'react';
import { Heart, User, Lock, AlertTriangle, Unlock } from 'lucide-react';

interface StudentDashboardProps {
  studentName: string;
  studentSeatId: string;
  studentComment: string;
  setStudentComment: (val: string) => void;
  studentLiveSeatLocked: boolean;
  onSendBroadcast: (status: 'ok' | 'ng', responseTime: number) => void;
  onChangeSeat: () => void;
  currentStatus: 'ok' | 'ng' | null;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = React.memo(({
  studentName,
  studentSeatId,
  studentComment,
  setStudentComment,
  studentLiveSeatLocked,
  onSendBroadcast,
  onChangeSeat,
  currentStatus,
}) => {
  const startTimeRef = React.useRef<number>(Date.now());

  // Reset timer on mount OR whenever currentStatus is cleared (meaning a new question session has started)
  React.useEffect(() => {
    if (currentStatus === null) {
      startTimeRef.current = Date.now();
    }
  }, [currentStatus]);

  const handleSend = (status: 'ok' | 'ng') => {
    const now = Date.now();
    const duration = now - startTimeRef.current;
    onSendBroadcast(status, duration);
    // Reset start time to measure subsequent status adjustments
    startTimeRef.current = now;
  };

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

      {/* Dynamic Status Banner */}
      <div 
        style={{ 
          padding: '1.25rem', 
          borderRadius: 'var(--radius-md)', 
          textAlign: 'center',
          fontWeight: 800,
          fontSize: '1.2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          transition: 'all var(--transition-normal)',
          border: '2px solid transparent',
          marginTop: '0.25rem',
          background: currentStatus === null 
            ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(239, 68, 68, 0.15))'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))',
          borderColor: currentStatus === null ? '#f97316' : '#10b981',
          color: currentStatus === null ? '#f97316' : '#10b981',
          animation: currentStatus === null ? 'bannerPulse 1.5s infinite alternate' : 'none'
        }}
      >
        {currentStatus === null ? (
          <>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span>現在、回答待ち（理解度を選択してください）</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: '1.5rem' }}>✓</span>
            <span>回答送信完了（次の質問を待機中）</span>
          </>
        )}
      </div>

      {studentLiveSeatLocked && (
        <div className="lock-banner" style={{ marginTop: '0' }}>
          <Lock size={14} />
          <span>教員によって座席の変更がロックされています</span>
        </div>
      )}

      <div className="input-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <label className="input-label" style={{ margin: 0 }}>コメント (任意)</label>
          {currentStatus && (
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ✓ 回答送信完了
            </span>
          )}
        </div>
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
          onClick={() => handleSend('ok')}
          className={`btn-huge btn-ok ${
            currentStatus === 'ok' ? 'active' : currentStatus === 'ng' ? 'inactive' : ''
          }`}
        >
          <Heart size={36} />
          <span>了解 (OK)</span>
        </button>
        <button
          onClick={() => handleSend('ng')}
          className={`btn-huge btn-ng ${
            currentStatus === 'ng' ? 'active' : currentStatus === 'ok' ? 'inactive' : ''
          }`}
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
