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
        {roomId && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            UUID チャンネル: <strong style={{ color: 'var(--text-primary)' }}>{roomId}</strong> (学生画面にコピーして使用)
          </p>
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
