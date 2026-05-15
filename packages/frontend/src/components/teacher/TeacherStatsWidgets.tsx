import React from 'react';
import { User } from 'lucide-react';

interface TeacherRecord {
  id: string;
  username: string;
  createdAt: string;
}

interface TeacherStatsWidgetsProps {
  teachersList: TeacherRecord[];
  currentTeacher: { id: string; username: string } | null;
}

export const TeacherStatsWidgets: React.FC<TeacherStatsWidgetsProps> = ({ teachersList, currentTeacher }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>登録済み教員総数</span>
        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {teachersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span>
        </span>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>システム管理者</span>
        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#6366f1' }}>
          {teachersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span>
        </span>
      </div>
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ログイン中</span>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#8b5cf6', marginTop: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '6px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <User size={16} /> {currentTeacher?.username || '不明なユーザー'}
        </span>
      </div>
    </div>
  );
};
