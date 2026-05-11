import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sliders, MonitorPlay, Users, LogOut, Search, Shield, ShieldAlert, CheckCircle, RefreshCw, Plus } from 'lucide-react';

interface UserTeacherPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface TeacherRecord {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'online' | 'offline';
  registeredAt: string;
}

export const UserTeacherPage: React.FC<UserTeacherPageProps> = ({ addToast }) => {
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (localStorage.getItem('teacher_auth') !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('teacher_auth');
    navigate('/');
  };

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulated Teacher Directory matching "今はadminしかでないけど一応"
  const [teachersList, setTeachersList] = useState<TeacherRecord[]>([
    {
      id: 'admin',
      name: '管理者 (教員)',
      role: 'システム管理者 / メイン教員',
      email: 'admin@seats-check.edu',
      status: 'online',
      registeredAt: '2026-05-08',
    },
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast('success', '教員一覧を更新しました。');
    }, 500);
  };

  // Filter & Search Logic
  const filteredTeachers = useMemo(() => {
    return teachersList.filter((teacher) => {
      return (
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [teachersList, searchQuery]);

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| 教員一覧</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn">
            <Sliders size={16} /> 教室設定
          </Link>
          <Link to="/seats/monitoring" className="mode-toggle-btn">
            <MonitorPlay size={16} /> 教員用監視
          </Link>
          <Link to="/student/monitoring" className="mode-toggle-btn">
            <Users size={16} /> 学生名簿
          </Link>
          <Link to="/user/teacher" className="mode-toggle-btn active">
            <ShieldAlert size={16} /> 教員一覧
          </Link>
          <button onClick={handleLogout} className="mode-toggle-btn" style={{ marginLeft: '1rem', color: 'var(--color-obstacle)' }}>
            <LogOut size={16} /> ログアウト
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Statistics Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>登録済み教員総数</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{teachersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>オンラインアクティブ</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981' }}>{teachersList.filter(t => t.status === 'online').length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>システム権限ロール</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#6366f1' }}>1 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>種</span></span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, alignItems: 'center' }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="text-input"
                placeholder="教員ID、名前、メールアドレス、役割で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Refresh */}
            <button className="btn btn-secondary" onClick={handleRefresh} style={{ padding: '0.5rem 0.75rem' }} title="再読み込み">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {/* Add Teacher (Future Extension Mock) */}
            <button 
              className="btn btn-primary" 
              onClick={() => addToast('info', '複数教員の新規追加機能は、管理者がデータベースを直接設定するか、今後のアップデートで公開予定です。')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Plus size={16} /> 新規教員追加
            </button>
          </div>
        </div>

        {/* Directory Datatable */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              読み込み中...
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
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '150px' }}>教員ユーザーID</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>表示名</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>役割 / 役職</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>メールアドレス</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '140px' }}>状態</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '140px' }}>登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher, index) => (
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
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{teacher.name}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Shield size={12} /> {teacher.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{teacher.email}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <CheckCircle size={12} /> オンライン
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{teacher.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
