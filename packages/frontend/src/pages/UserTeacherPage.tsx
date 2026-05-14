import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sliders, MonitorPlay, Users, LogOut, Search, Shield, ShieldAlert, CheckCircle, RefreshCw, Plus, Trash2, X, Loader2, Key, LayoutGrid } from 'lucide-react';
import client from '../lib/hc';

interface UserTeacherPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface TeacherRecord {
  id: string;
  username: string;
  createdAt: string;
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
    localStorage.removeItem('teacher_jwt');
    localStorage.removeItem('supabase_teacher_token');
    localStorage.removeItem('logged_in_teacher');
    navigate('/');
  };

  const [teachersList, setTeachersList] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Teacher Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve current logged-in teacher details to lock self-deletion
  const currentTeacher = useMemo(() => {
    try {
      const raw = localStorage.getItem('logged_in_teacher');
      return raw ? JSON.parse(raw) as { id: string; username: string } : null;
    } catch {
      return null;
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await client.api.teachers.$get();
      if (res.ok) {
        const data = await res.json();
        setTeachersList(data.teachers);
      } else {
        console.error('教員一覧の取得に失敗しました。');
      }
    } catch (err) {
      console.error('サーバーとの通信に失敗しました。', err);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Load teachers on component mount
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleRefresh = () => {
    fetchTeachers().then(() => {
      addToast('success', '教員一覧を更新しました。');
    });
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameInput.trim() || !passwordInput) {
      addToast('error', 'ユーザー名とパスワードを入力してください。');
      return;
    }

    if (usernameInput.trim().length < 3) {
      addToast('error', 'ユーザー名は3文字以上で入力してください。');
      return;
    }

    if (passwordInput.length < 6) {
      addToast('error', 'パスワードは6文字以上で入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.api.teachers.$post({
        json: {
          username: usernameInput.trim(),
          password: passwordInput,
        },
      });

      if (res.ok) {
        addToast('success', `新規教員「${usernameInput.trim()}」を追加しました！`);
        setUsernameInput('');
        setPasswordInput('');
        setIsAddModalOpen(false);
        fetchTeachers();
      } else {
        const errData = await res.json() as { error?: string };
        addToast('error', errData.error || '教員の登録に失敗しました。');
      }
    } catch (err) {
      console.error('教員登録中にエラーが発生しました。', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (currentTeacher && currentTeacher.id === id) {
      addToast('error', '現在ログイン中の自分自身のアカウントを削除することはできません。');
      return;
    }

    if (!window.confirm(`【アカウント削除】\n教員アカウント「${name}」をシステムから完全に削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      const res = await client.api.teachers[':id'].$delete({
        param: { id },
      });

      if (res.ok) {
        addToast('success', `教員「${name}」を削除しました。`);
        fetchTeachers();
      } else {
        const errData = await res.json() as { error?: string };
        addToast('error', errData.error || '教員の削除に失敗しました。');
      }
    } catch (err) {
      console.error('削除中にエラーが発生しました。', err);
    }
  };

  // Filter & Search Logic
  const filteredTeachers = useMemo(() => {
    return teachersList.filter((teacher) => {
      const search = searchQuery.toLowerCase();
      return (
        teacher.username.toLowerCase().includes(search) ||
        teacher.id.toLowerCase().includes(search)
      );
    });
  }, [teachersList, searchQuery]);

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', minWidth: '1280px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(248, 250, 252, 0) 50%)' }}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">
            <LayoutGrid size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| 教員一覧</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn layout-btn">
            <Sliders size={16} /> 教室設定
          </Link>
          <Link to="/seats/monitoring" className="mode-toggle-btn monitor-btn">
            <MonitorPlay size={16} /> みんなの様子
          </Link>
          <Link to="/student/monitoring" className="mode-toggle-btn students-btn">
            <Users size={16} /> 学生名簿
          </Link>
          <Link to="/user/teacher" className="mode-toggle-btn teachers-btn active">
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
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>システム管理者</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#6366f1' }}>{teachersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ログイン中</span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#8b5cf6', marginTop: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '6px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              👤 {currentTeacher?.username || '不明なユーザー'}
            </span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'nowrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '1rem', flex: 1, alignItems: 'center' }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="text-input"
                placeholder="教員ID、ユーザー名で検索..."
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
            {/* Add Teacher */}
            <button 
              className="btn btn-primary" 
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            >
              <Plus size={16} /> 新規教員追加
            </button>
          </div>
        </div>

        {/* Directory Datatable */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading && teachersList.length === 0 ? (
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
                            onClick={() => handleDeleteTeacher(teacher.id, teacher.username)}
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
      </main>

      {/* 👥 Add Teacher Dialog / Modal Overlay (Approach B aesthetic glassmorphism) */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2.5rem 2rem',
            background: 'var(--card-bg, #1e293b)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            <button 
              onClick={() => {
                setIsAddModalOpen(false);
                setUsernameInput('');
                setPasswordInput('');
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '50%'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-teacher)' }}>
                <Plus size={20} />
              </div>
              <h2 className="card-title" style={{ fontSize: '1.35rem', margin: 0 }}>新規教員の登録</h2>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              新しく登録する教員アカウントのユーザー名とパスワードを決定してください。
            </p>

            <form onSubmit={handleAddTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} /> ユーザー名
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="ユーザー名を入力... (例: sato_teacher)"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="input-group" style={{ textAlign: 'left' }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Key size={14} /> パスワード
                </label>
                <input
                  type="password"
                  className="text-input"
                  placeholder="パスワードを入力... (6文字以上)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setUsernameInput('');
                    setPasswordInput('');
                  }}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      登録中...
                    </>
                  ) : (
                    '登録する'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
