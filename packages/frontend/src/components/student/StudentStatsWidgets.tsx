import React from 'react';

interface UserRecord {
  status: 'ok' | 'ng' | 'none';
}

interface StudentStatsWidgetsProps {
  usersList: UserRecord[];
}

export const StudentStatsWidgets: React.FC<StudentStatsWidgetsProps> = ({ usersList }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>総チェックイン学生数</span>
        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981' }}>
          {usersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span>
        </span>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>着席中 (OK)</span>
        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981' }}>
          {usersList.filter(u => u.status === 'ok').length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span>
        </span>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>要確認 (NG)</span>
        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#ef4444' }}>
          {usersList.filter(u => u.status === 'ng').length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span>
        </span>
      </div>
    </div>
  );
};
