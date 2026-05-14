import React from 'react';
import { Lock, Unlock, Trash2, RotateCcw, Save, AlertTriangle } from 'lucide-react';

interface ControlPanelProps {
  roomName: string;
  caseName?: string;
  roomId: string | null;
  isSeatLocked: boolean;
  onToggleSeatLock: () => void;
  onClearGrid: () => void;
  onBulkReset: () => void;
  onSaveClassroom: () => void;
  isSaving: boolean;
  mode?: 'layout' | 'monitor';
}

export const ControlPanel = React.memo(({
  roomName,
  caseName,
  roomId,
  isSeatLocked,
  onToggleSeatLock,
  onClearGrid,
  onBulkReset,
  onSaveClassroom,
  isSaving,
  mode = 'layout',
}: ControlPanelProps) => {

  return (
    <div className="workspace-header">
      <div className="workspace-title-group">
        <h2 className="workspace-title">{mode === 'monitor' ? 'みんなの様子' : '教室設定'}</h2>
        <p className="workspace-subtitle">
          {mode === 'monitor' ? (
            <>
              教室：<strong>{roomName}</strong>（リアルタイム監視中）
            </>
          ) : (
            <>
              教室：<strong>{roomName}</strong>（レイアウトを編集中）
            </>
          )}
        </p>
        {roomId ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            教室のID: <strong style={{ color: 'var(--text-primary)', userSelect: 'all' }}>{roomId}</strong>
          </p>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'rgba(245, 158, 11, 0.85)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={14} /> <span><strong>未登録の新規教室です。</strong> 「<strong>教室を保存</strong>」ボタンから登録してください。</span>
          </p>
        )}
      </div>
      <div className="btn-group">
        {mode === 'monitor' && (
          <>
            <button className="btn btn-danger" onClick={onBulkReset}>
              <RotateCcw size={16} /> みんなの回答をクリア
            </button>
          </>
        )}

        {mode === 'layout' && (
          <>
            <button className="btn btn-secondary" onClick={onClearGrid}>
              <Trash2 size={16} /> クリア
            </button>
            <button 
              className="btn btn-primary" 
              disabled={isSaving} 
              onClick={onSaveClassroom}
            >
              <Save size={16} /> {isSaving ? '保存中...' : '教室を保存'}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';
