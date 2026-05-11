import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

interface LoginPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ addToast }) => {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Read from Vite env var, fallback to 'admin' if not configured
    const correctPassword = import.meta.env.VITE_TEACHER_PASSWORD || 'admin';

    if (password === correctPassword) {
      localStorage.setItem('teacher_auth', 'true');
      addToast('success', 'ログインしました。教員用管理画面へ移動します。');
      navigate('/room_layout');
    } else {
      addToast('error', 'パスワードが間違っています。');
      setPassword('');
    }
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check</h1>
        </div>
      </header>
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-teacher)', marginBottom: '1.5rem' }}>
            <Lock size={32} />
          </div>
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', justifyContent: 'center' }}>教員ログイン</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            システムを利用するにはパスワードを入力してください。
          </p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label className="input-label">パスワード</label>
              <input
                type="password"
                className="text-input"
                placeholder="パスワードを入力..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--color-teacher)', padding: '0.75rem', marginTop: '0.5rem' }}>
              ログイン
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
