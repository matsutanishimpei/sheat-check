import React from 'react';
import { Shield, Trash2, Loader2 } from 'lucide-react';

interface TeacherRecord {
  id: string;
  username: string;
  createdAt: string;
}

interface TeacherListTableProps {
  isLoading: boolean;
  teachersListLength: number;
  filteredTeachers: TeacherRecord[];
  currentTeacher: { id: string; username: string } | null;
  onDeleteTeacher: (id: string, name: string) => void;
}

export const TeacherListTable: React.FC<TeacherListTableProps> = ({
  isLoading,
  teachersListLength,
  filteredTeachers,
  currentTeacher,
  onDeleteTeacher
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {isLoading && teachersListLength === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'inline' }} />
          <p style={{ marginTop: '0.5rem' }}>読み込み中...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>登録された教員は見つかりませんでした</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '320px' }}>教員アカウントID</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>ユーザー名</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>システム権限</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '180px' }}>登録日</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '100px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher, index) => {
                const isSelf = currentTeacher?.id === teacher.id;
                const dateStr = teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }) : '-';

                return (
                  <tr 
                    key={teacher.id} 
                    style={{ 
                      borderBottom: index === filteredTeachers.length - 1 ? 'none' : '1px solid var(--border-color)',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{teacher.id}</code>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                      {teacher.username} 
                      {isSelf && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-teacher)', marginLeft: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          あなた
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <Shield size={12} /> 教員アカウント
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{dateStr}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => onDeleteTeacher(teacher.id, teacher.username)}
                        disabled={isSelf}
                        style={{ 
                          padding: '0.35rem 0.6rem', 
                          color: isSelf ? 'var(--text-muted)' : '#ef4444', 
                          borderColor: isSelf ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.2)',
                          backgroundColor: isSelf ? 'transparent' : 'rgba(239, 68, 68, 0.05)',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={isSelf ? 'ログイン中の教員アカウントは削除できません' : '教員アカウントを削除'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
