import React from 'react';
import { Database, QrCode, AlertTriangle } from 'lucide-react';

interface MonitorSettingsDrawerProps {
  roomId: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
  setSupabaseUrl: (url: string) => void;
  setSupabaseAnonKey: (key: string) => void;
  onSaveSupabaseConfig: () => void;
}

export const MonitorSettingsDrawer: React.FC<MonitorSettingsDrawerProps> = ({
  roomId,
  supabaseUrl,
  supabaseAnonKey,
  setSupabaseUrl,
  setSupabaseAnonKey,
  onSaveSupabaseConfig
}) => {
  const hasValidSupabaseUrl = supabaseUrl && supabaseUrl.trim() !== '' && !supabaseUrl.includes('temp-placeholder');

  return (
    <div 
      className="card" 
      style={{ 
        width: '100%', 
        padding: '1.5rem', 
        display: 'flex', 
        gap: '2rem', 
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Left side: Supabase Credentials */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Database size={18} color="var(--color-teacher)" /> 
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>Supabase 接続設定</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>API URL</label>
            <input
              type="text"
              className="text-input"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ANON KEY</label>
            <input
              type="password"
              className="text-input"
              placeholder="your-anon-key"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
            />
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ alignSelf: 'flex-start', padding: '0.5rem 1.5rem', marginTop: '0.5rem' }} 
          onClick={onSaveSupabaseConfig}
        >
          設定を保存して接続
        </button>
      </div>

      {/* Vertical Divider */}
      <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

      {/* Right side: Student QR Code or setup guide */}
      {hasValidSupabaseUrl && roomId ? (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
          <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
            <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/student/' + roomId)}`} 
              alt="Student QR Code" 
              style={{ width: '180px', height: '180px', display: 'block' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="var(--color-student)" />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>学生用チェックイン QR</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              学生はスマートフォンでこのQRコードを読み取ることで、アプリにログインして自分の座席を選択できます。
            </p>
            <a 
              href={`${window.location.origin}/student/${roomId}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontSize: '0.85rem', color: 'var(--color-student)', textDecoration: 'underline', marginTop: '0.5rem', wordBreak: 'break-all' }}
            >
              {window.location.origin}/student/{roomId}
            </a>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '1rem', border: '2px dashed rgba(245, 158, 11, 0.3)', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.05)', textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>Supabase 接続未設定</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '320px', lineHeight: 1.4 }}>
            左側のフォームに有効な Supabase 設定を入力し「設定を保存して接続」ボタンをクリックすると、ここに学生用のチェックインQRコードが自動生成されます。
          </p>
        </div>
      )}
    </div>
  );
};
