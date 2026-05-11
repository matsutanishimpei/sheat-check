import React, { useCallback } from 'react';
import { 
  DndContext, 
  useDraggable, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  Users, 
  GraduationCap, 
  XCircle, 
  DoorOpen, 
  Database, 
  Sliders, 
  Layers, 
  ArrowRight, 
  Plus, 
  Trash2, 
  FolderOpen, 
  RefreshCw, 
  Activity 
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { GridItem, LiveSeatStatus, RealtimeLog } from '@my-app/shared';
import { SeatMap } from '../components/SeatMap';
import { ControlPanel } from '../components/ControlPanel';

interface SavedRoom {
  id: string;
  name: string;
}

interface EditorCase {
  caseName: string;
  grid: Record<string, GridItem['type']>;
}

interface TeacherViewProps {
  supabase: SupabaseClient | null;
  supabaseUrl: string;
  setSupabaseUrl: (url: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (key: string) => void;
  onSaveSupabaseConfig: () => void;
  roomName: string;
  setRoomName: (name: string) => void;
  onCreateNewSession: () => void;
  cases: EditorCase[];
  activeCaseIdx: number;
  setActiveCaseIdx: (idx: number) => void;
  onUpdateActiveCaseName: (name: string) => void;
  onAddNewCase: () => void;
  onDeleteCurrentCase: () => void;
  isLoadingRooms: boolean;
  savedRooms: SavedRoom[];
  roomId: string | null;
  onLoadClassroom: (id: string) => void;
  onFetchRooms: () => void;
  realtimeLogs: RealtimeLog[];
  isSeatLocked: boolean;
  onToggleSeatLock: () => void;
  onClearGrid: () => void;
  onBulkReset: () => void;
  onSaveClassroom: () => void;
  isSaving: boolean;
  onDragEnd: (event: DragEndEvent) => void;
  onCellCycle: (x: number, y: number) => void;
  liveStatuses: Record<string, LiveSeatStatus>;
  mode?: 'layout' | 'monitor';
}

const PALETTE_ITEMS = [
  { type: 'student' as const, name: '学生席 (Student)', icon: Users, colorClass: 'student' },
  { type: 'teacher' as const, name: '教卓 (Teacher)', icon: GraduationCap, colorClass: 'teacher' },
  { type: 'obstacle' as const, name: '使用不可 (Obstacle)', icon: XCircle, colorClass: 'obstacle' },
  { type: 'door' as const, name: '出入口 (Door)', icon: DoorOpen, colorClass: 'door' },
];

/* ==========================================================================
   Draggable Palette Component
   ========================================================================== */
function DraggablePaletteItem({ 
  type, 
  name, 
  icon: Icon, 
  colorClass 
}: { 
  type: GridItem['type']; 
  name: string; 
  icon: any; 
  colorClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 100 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="palette-item"
      {...listeners}
      {...attributes}
    >
      <div className={`palette-color-indicator ${colorClass}`} />
      <Icon size={18} />
      <span className="palette-name">{name}</span>
    </div>
  );
}

export const TeacherView: React.FC<TeacherViewProps> = React.memo(({
  supabase,
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  onSaveSupabaseConfig,
  roomName,
  setRoomName,
  onCreateNewSession,
  cases,
  activeCaseIdx,
  setActiveCaseIdx,
  onUpdateActiveCaseName,
  onAddNewCase,
  onDeleteCurrentCase,
  isLoadingRooms,
  savedRooms,
  roomId,
  onLoadClassroom,
  onFetchRooms,
  realtimeLogs,
  isSeatLocked,
  onToggleSeatLock,
  onClearGrid,
  onBulkReset,
  onSaveClassroom,
  isSaving,
  onDragEnd,
  onCellCycle,
  liveStatuses,
  mode = 'layout',
}) => {
  return (
    <main className="main-content">
      
      {/* Left Control Sidebar - Only in layout mode */}
      {mode === 'layout' && (
      <div className="sidebar">
        
        {/* General Room Config Card */}
        <div className="card">
          <h2 className="card-title">
            <Sliders size={18} /> 講義室の基本設定
          </h2>
          <div className="input-group">
            <label className="input-label">教室名 (Room Name)</label>
            <input
              type="text"
              className="text-input"
              placeholder="例: 一般講義室 301"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%' }}
            onClick={onCreateNewSession}
          >
            新規デザイン開始
          </button>
        </div>



        {/* D1 History Room List Card */}
        <div className="card">
          <h2 className="card-title">
            <FolderOpen size={18} /> 保存済み講義室
          </h2>
          {isLoadingRooms ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              読み込み中...
            </p>
          ) : savedRooms.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              保存された教室はありません
            </p>
          ) : (
            <div className="room-list-container">
              {savedRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onLoadClassroom(room.id)}
                  className={`room-item-btn ${roomId === room.id ? 'selected' : ''}`}
                >
                  <span className="room-item-name">{room.name}</span>
                  <FolderOpen size={14} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          )}
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
            onClick={onFetchRooms}
          >
            <RefreshCw size={14} /> リスト更新
          </button>
        </div>

        {/* Realtime Event Monitor Panel */}
        <div className="card">
          <h2 className="card-title">
            <Activity size={18} style={{ color: 'var(--color-student)' }} /> リアルタイム受信ログ
          </h2>
          {realtimeLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              学生からの通信待機中...
            </p>
          ) : (
            <div className="activity-feed-container">
              {realtimeLogs.map((log) => (
                <div key={log.id} className={`feed-item ${log.status}`}>
                  <div className="feed-item-header">
                    <span>{log.studentName} ({log.seatId})</span>
                    <span style={{ 
                      color: log.status === 'ok' 
                        ? 'var(--color-door)' 
                        : log.status === 'ng' 
                          ? 'var(--color-obstacle)' 
                          : 'var(--text-muted)', 
                      fontWeight: 'bold' 
                    }}>
                      {log.status === 'none' ? '解除' : log.status.toUpperCase()}
                    </span>
                  </div>
                  {log.comment && <span className="feed-item-comment">「{log.comment}」</span>}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      )}

      {/* Right Editor Canvas */}
      <DndContext onDragEnd={onDragEnd}>
        <div className="workspace">
          
          {/* Editor Action Bar */}
          <ControlPanel
            roomName={roomName}
            caseName={cases[activeCaseIdx]?.caseName}
            roomId={roomId}
            isSeatLocked={isSeatLocked}
            onToggleSeatLock={onToggleSeatLock}
            onClearGrid={onClearGrid}
            onBulkReset={onBulkReset}
            onSaveClassroom={onSaveClassroom}
            isSaving={isSaving}
          />

          {/* Editor Panel Split */}
          <div className="editor-grid-layout">
            
            {/* Left Item Palette */}
            {mode === 'layout' && (
            <div className="palette">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: '500' }}>
                💡 アイテムをマス目へドラッグ＆ドロップ、または直接クリックして配置してください。
              </p>
              {PALETTE_ITEMS.map((item) => (
                <DraggablePaletteItem
                  key={item.type}
                  type={item.type}
                  name={item.name}
                  icon={item.icon}
                  colorClass={item.colorClass}
                />
              ))}
            </div>
            )}

            {/* Right Interactive 9x9 CSS Grid (Now Overlaying realtime status) */}
            <SeatMap
              grid={cases[activeCaseIdx]?.grid}
              liveStatuses={liveStatuses}
              onCycle={mode === 'monitor' ? () => {} : onCellCycle}
              massive={mode === 'monitor'}
            />

          </div>

        </div>
      </DndContext>

    </main>
  );
});

TeacherView.displayName = 'TeacherView';
