import React from 'react';
import { FolderOpen, RotateCcw, Download, Trash2 } from 'lucide-react';

interface MonitorControlBarProps {
  savedRooms: { id: string; name: string }[];
  roomId: string | null;
  isActive: boolean;
  onLoadClassroom: (id: string) => void;
  onBulkReset: () => void;
  onExportCSV: () => void;
  onClearSavedResponses: () => void;
  onToggleActive: () => void;
}

export const MonitorControlBar: React.FC<MonitorControlBarProps> = ({
  savedRooms,
  roomId,
  isActive,
  onLoadClassroom,
  onBulkReset,
  onExportCSV,
  onClearSavedResponses,
  onToggleActive
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      
      {/* Left: Room & Case Selection and Monitor Controls */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
        <div className="card" style={{ padding: '0.75rem 1rem', flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <FolderOpen size={20} />
          <select 
            className="text-input" 
            value={roomId || ''} 
            onChange={(e) => onLoadClassroom(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">教室を選択してください</option>
            {savedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        
        {/* Monitor Controls (Lock/Reset) */}
        {roomId && (
          <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={onBulkReset} title="現在の学生の回答状態を履歴に保存し、全員の回答状況をクリアして新しい質問を開始します。">
               <RotateCcw size={16}/> みんなの回答をクリア
            </button>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={onExportCSV}>
               <Download size={16}/> 回答ログ (CSV)
            </button>
            <button 
              className="btn" 
              style={{ 
                padding: '0.5rem 0.75rem', 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid var(--border-color)', 
                color: 'var(--text-muted)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.8rem',
                transition: 'all var(--transition-fast)'
              }} 
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              onClick={onClearSavedResponses}
              title="これまでに保存された本日の質問履歴をクリアします（次の講義を始める際などに手動でクリアしたい場合に使用します）"
            >
               <Trash2 size={14}/> 履歴クリア
            </button>
          </div>
        )}

        {/* Reception Status Control (Open/Closed) */}
        {roomId && (
          <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>受付ステータス:</span>
            <button 
              className="btn" 
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: isActive ? 'rgba(106, 148, 120, 0.12)' : 'rgba(181, 96, 106, 0.12)', 
                border: 'none',
                color: isActive ? '#6A9478' : '#B5606A',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }} 
              onClick={onToggleActive}
            >
              {isActive ? '● 受付中 (Open)' : '○ クローズ (Closed)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
