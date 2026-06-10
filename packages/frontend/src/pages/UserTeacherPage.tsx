import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Search, Shield, ShieldAlert, CheckCircle, RefreshCw, Plus, Trash2, X, Loader2, Key, LayoutGrid } from 'lucide-react';
import client from '../lib/hc';
import { useToast } from '../contexts/ToastContext';
import { teacherAuth } from '../lib/storage';
import { useRequireAuth, useLogout } from '../hooks/useRequireAuth';
import { TeacherHeader } from '../components/layout/TeacherHeader';
import { TeacherStatsWidgets } from '../components/teacher/TeacherStatsWidgets';
import { TeacherListTable } from '../components/teacher/TeacherListTable';
import { AddTeacherModal } from '../components/teacher/AddTeacherModal';

export interface TeacherRecord {
  id: string;
  username: string;
  createdAt: string;
}

export const UserTeacherPage: React.FC = () => {
  useRequireAuth();
  const handleLogout = useLogout();
  const { addToast } = useToast();

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
    return teacherAuth.getLoggedInTeacher();
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
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', minWidth: '1280px', background: 'linear-gradient(135deg, rgba(114, 98, 122, 0.08) 0%, rgba(248, 250, 252, 0) 50%)' }}>
      {/* App Header */}
      <TeacherHeader activePage="teachers" subtitle="教員一覧" onLogout={handleLogout} />

      {/* Main Container */}
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Statistics Widgets */}
        <TeacherStatsWidgets 
          teachersList={teachersList} 
          currentTeacher={currentTeacher} 
        />

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
        <TeacherListTable 
          isLoading={isLoading}
          teachersListLength={teachersList.length}
          filteredTeachers={filteredTeachers}
          currentTeacher={currentTeacher}
          onDeleteTeacher={handleDeleteTeacher}
        />
      </main>

      {/* 👥 Add Teacher Dialog / Modal */}
      <AddTeacherModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setUsernameInput('');
          setPasswordInput('');
        }}
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        isSubmitting={isSubmitting}
        onSubmit={handleAddTeacher}
      />
    </div>
  );
};
