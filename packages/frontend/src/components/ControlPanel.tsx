import React from 'react';
import { Lock, Unlock, Trash2, Sparkles, RotateCcw, Save } from 'lucide-react';

interface ControlPanelProps {
  roomName: string;
  caseName?: string;
  roomId: string | null;
  isSeatLocked: boolean;
  onToggleSeatLock: () => void;
  onClearGrid: () => void;
  onApplyRowPreset: () => void;
  onBulkReset: () => void;
  onSaveClassroom: () => void;
  isSaving: boolean;
}

export const ControlPanel = React.memo(({
  roomName,
  caseName,
  roomId,
  isSeatLocked,
  onToggleSeatLock,
  onClearGrid,
  onApplyRowPreset,
  onBulkReset,
  onSaveClassroom,
  isSaving,
}: ControlPanelProps) => {
  return (
    <div className="workspace-header">
      <div className="workspace-title-group">
        <h2 className="workspace-title">教員用監視＆レイアウトスタジオ</h2>
        <p className="workspace-subtitle">
          {roomName} / <strong style={{ color: 'var(--color-student)' }}>{caseName || '通常講義 (標準)'}</strong> を編集中
        </p>
        {roomId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.1)', width: 'fit-content' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                UUID チャンネル: <strong style={{ color: 'var(--text-primary)', userSelect: 'all' }}>{roomId}</strong>
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-student)' }}>
                🔗 <a href={`${window.location.origin}/?room=${roomId}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>学生用ログインリンクを開く</a>
              </p>
            </div>
            {/* Dynamic QR Code Generator (No external JS bundlers required) */}
            <div style={{ background: '#fff', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="スマホでスキャンして簡単入室">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/?room=${roomId}`)}`} 
                alt="QR Code" 
                style={{ width: '60px', height: '60px', display: 'block' }} 
              />
            </div>
          </div>
        ) : (
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255, 255, 255, 0.7)', 
            marginTop: '0.5rem', 
            background: 'rgba(245, 158, 11, 0.08)', 
            padding: '0.5rem 0.75rem', 
            borderRadius: 'var(--radius-md)', 
            width: 'fit-content', 
            border: '1px solid rgba(245, 158, 11, 0.2)',
            lineHeight: '1.4'
          }}>
            ⚠️ <strong>教室を未保存です。</strong><br />
            まずは右上の「<strong>D1 に保存</strong>」ボタンで教室を保存・登録してください。<br />
            保存完了後に、ここに学生招待用の <strong>QRコード</strong> が表示されます。
          </div>
        )}
      </div>
      <div className="btn-group">
        {/* Seat Lock Custom Switch Toggle */}
        <div 
          className="toggle-container" 
          onClick={onToggleSeatLock}
          title="ONにすると、学生は自分の登録座席を変更できなくなります"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {isSeatLocked ? <Lock size={14} style={{ color: 'var(--color-teacher)' }} /> : <Unlock size={14} style={{ color: 'var(--color-door)' }} />}
            座席ロック
          </span>
          <div className={`switch-track ${isSeatLocked ? 'active' : ''}`}>
            <div className="switch-thumb" />
          </div>
        </div>

        <button className="btn btn-secondary" onClick={onClearGrid}>
          <Trash2 size={16} /> クリア
        </button>
        <button className="btn btn-secondary" onClick={onApplyRowPreset}>
          <Sparkles size={16} /> 列配置プリセット
        </button>
        <button className="btn btn-danger" onClick={onBulkReset}>
          <RotateCcw size={16} /> 一括リセット
        </button>
        <button 
          className="btn btn-primary" 
          disabled={isSaving} 
          onClick={onSaveClassroom}
        >
          <Save size={16} /> {isSaving ? '保存中...' : 'D1 に保存'}
        </button>
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';
