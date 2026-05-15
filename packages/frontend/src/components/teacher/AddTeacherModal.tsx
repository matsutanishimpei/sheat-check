import React from 'react';
import { User, Key, X, Plus, Loader2 } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({
  isOpen,
  onClose,
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  isSubmitting,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
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
          onClick={onClose}
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

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={14} /> ユーザー名
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
              onClick={onClose}
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
  );
};
