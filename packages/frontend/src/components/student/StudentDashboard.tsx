import React from 'react';
import { Heart, User, Lock, AlertTriangle, Unlock } from 'lucide-react';

interface StudentDashboardProps {
  studentName: string;
  studentSeatId: string;
  studentComment: string;
  setStudentComment: (val: string) => void;
  studentLiveSeatLocked: boolean;
  onSendBroadcast: (status: 'ok' | 'ng', responseTime: number, overrideComment?: string) => void;
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

  const handleSend = (status: 'ok' | 'ng', overrideComment?: string) => {
    const now = Date.now();
    const duration = now - startTimeRef.current;
    onSendBroadcast(status, duration, overrideComment);
    // Reset start time to measure subsequent status adjustments
    startTimeRef.current = now;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="student-title-group" style={{ marginBottom: 0 }}>
        <h2 className="student-title">
          <Heart size={24} style={{ color: '#0891b2' }} /> 講義フィードバック
        </h2>
      </div>

      {/* Fixed seat details & subtle status summary */}
      <div style={{ background: 'rgba(255, 255, 255, 0.5)', padding: '1rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(8, 145, 178, 0.1)', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{studentName} さん</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>登録席: <strong style={{ color: '#0891b2' }}>{studentSeatId}</strong></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700 }}>
          {currentStatus === null ? (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'bannerPulse 1.5s infinite alternate' }} />
              回答待ち
            </span>
          ) : (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ✓ 送信済み
            </span>
          )}
        </div>
      </div>

      {studentLiveSeatLocked && (
        <div className="lock-banner" style={{ marginTop: '0' }}>
          <Lock size={14} />
          <span>教員によって座席の変更がロックされています</span>
        </div>
      )}

      {/* Mood Selector Buttons (Zero Typing / Absolute Single Line 2x3 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.5rem' }}>
        {/* 1. 順調 */}
        <button
          onClick={() => {
            const msg = '[順調] ペースも理解もバッチリです！';
            setStudentComment(msg);
            handleSend('ok', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
            color: '#059669',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>✨</span>
          <span>バッチリ！</span>
        </button>

        {/* 2. なるほど */}
        <button
          onClick={() => {
            const msg = '[なるほど] 今の説明とても分かりやすくて腑に落ちました！';
            setStudentComment(msg);
            handleSend('ok', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(8, 145, 178, 0.3)',
            background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.15), rgba(14, 116, 144, 0.05))',
            color: '#0891b2',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(8, 145, 178, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>💡</span>
          <span>なるほど！</span>
        </button>

        {/* 3. メモ待って */}
        <button
          onClick={() => {
            const msg = '[待って] メモを取っているので少し待ってください';
            setStudentComment(msg);
            handleSend('ng', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
            color: '#d97706',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>✍️</span>
          <span>メモ待って</span>
        </button>

        {/* 4. わからない */}
        <button
          onClick={() => {
            const msg = '[SOS] 説明が難しくて理解が追いついていません';
            setStudentComment(msg);
            handleSend('ng', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.05))',
            color: '#dc2626',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(239, 68, 68, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>❓</span>
          <span>むずかしい</span>
        </button>

        {/* 5. 声が遠い */}
        <button
          onClick={() => {
            const msg = '[音響SOS] マイクの音声が遠い・聞き取りにくいです';
            setStudentComment(msg);
            handleSend('ng', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.05))',
            color: '#7c3aed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(139, 92, 246, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>📢</span>
          <span>声が遠い</span>
        </button>

        {/* 6. 空調 */}
        <button
          onClick={() => {
            const msg = '[環境SOS] 教室の空調（暑い/寒い）の調整をお願いしたいです';
            setStudentComment(msg);
            handleSend('ng', msg);
          }}
          style={{
            padding: '1.5rem 0.5rem',
            borderRadius: '18px',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15), rgba(71, 85, 105, 0.05))',
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(100, 116, 139, 0.08)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
        >
          <span style={{ fontSize: '1.75rem' }}>❄️</span>
          <span>暑い・寒い</span>
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
