import React from 'react';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface UserRecord {
  roomId: string;
  roomName: string;
  seatId: string;
  name: string;
  status: 'ok' | 'ng' | 'none';
  comment?: string;
}

interface StudentListTableProps {
  isLoading: boolean;
  filteredUsers: UserRecord[];
  onRemoveCheckin: (record: UserRecord) => void;
}

export const StudentListTable: React.FC<StudentListTableProps> = ({
  isLoading,
  filteredUsers,
  onRemoveCheckin
}) => {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          読み込み中...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>登録された学生は見つかりませんでした</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>検索条件を変更するか、出席登録状況をご確認ください。</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>学生名</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>所属教室</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '120px' }}>座席番号</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '140px' }}>ステータス</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>コメント</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '100px', textAlign: 'center' }}>アクション</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={`${user.roomId}_${user.seatId}`} 
                  style={{ 
                    borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                  }}
                >
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{user.name}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.roomName}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{user.seatId}</code>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    {user.status === 'ok' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <CheckCircle size={12} /> 着席 (OK)
                      </span>
                    ) : (
                      <span className="pulse-ng" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        <AlertCircle size={12} /> 要確認 (NG)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontStyle: user.comment ? 'normal' : 'italic' }}>
                    {user.comment || 'コメントなし'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => onRemoveCheckin(user)} 
                      className="btn" 
                      style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="チェックイン解除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
