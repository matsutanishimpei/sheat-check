import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DragEndEvent } from '@dnd-kit/core';
import { useRoomLayout } from '../hooks/useRoomLayout';
import { useSeatManager } from '../hooks/useSeatManager';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { TeacherView } from '../containers/TeacherView';
import { LiveSeatStatus, GridItem } from '@my-app/shared';
import { LogOut, Sliders, MonitorPlay, FolderOpen, Lock, Unlock, RotateCcw, Database, ChevronUp, ChevronDown, QrCode, Users, ShieldAlert } from 'lucide-react';
import { SeatMap } from '../components/SeatMap';
import client from '../lib/hc';

interface TeacherMonitorPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const TeacherMonitorPage: React.FC<TeacherMonitorPageProps> = ({ addToast }) => {
  const navigate = useNavigate();

  const minWidth = import.meta.env.VITE_MONITOR_CELL_MIN_WIDTH || '80';
  const minHeight = import.meta.env.VITE_MONITOR_CELL_MIN_HEIGHT || '40';

  useEffect(() => {
    if (localStorage.getItem('teacher_auth') !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('teacher_auth');
    navigate('/');
  };

  // Supabase Credentials
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sb_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('sb_key') || '');
  
  // Realtime Live Statuses mapped by seat ID
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveSeatStatus>>({});
  


  const {
    roomName,
    setRoomName,
    roomId,
    cases,
    activeCaseIdx,
    setActiveCaseIdx,
    updateActiveCaseName,
    addNewCase,
    deleteCurrentCase,
    isLoadingRooms,
    savedRooms,
    isSaving,
    loadClassroom,
    saveClassroom,
    createNewClassroomSession,
    isActive,
    setIsActive,
    fetchRooms,
    clearCurrentGrid,
    updateGridCell,
  } = useRoomLayout({
    addToast,
    onClearLiveStatuses: () => setLiveStatuses({}),
    supabaseUrl,
    supabaseAnonKey,
    setSupabaseUrl,
    setSupabaseAnonKey,
  });

  const {
    isSeatLocked,
    toggleSeatLock,
    bulkResetLiveStatuses,
    removeLiveStatus,
  } = useSeatManager({
    roomId,
    addToast,
  });

  const {
    supabase,
    realtimeLogs,
    isOnline,
    saveSupabaseConfig,
    sendTeacherResetBroadcast,
    sendStudentEvictedBroadcast,
    sendTeacherLockStateBroadcast,
  } = useRealtimeSession({
    roomId,
    studentClassroomId: '', // Teacher doesn't need student classroom id
    isSeatLocked,
    setLiveStatuses,
    addToast,
    onTeacherReset: () => bulkResetLiveStatuses(),
    onTeacherLockState: () => toggleSeatLock(),
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
  });

  const handleRemoveLiveStatus = useCallback((key: string) => {
    removeLiveStatus(key);
    sendStudentEvictedBroadcast(key);
  }, [removeLiveStatus, sendStudentEvictedBroadcast]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;

    const dragType = active.data.current?.type as GridItem['type'];
    const { x, y } = over.data.current as { x: number; y: number };

    if (dragType && typeof x === 'number' && typeof y === 'number') {
      updateGridCell(x, y, dragType, handleRemoveLiveStatus);
    }
  }, [updateGridCell, handleRemoveLiveStatus]);

  const handleCellCycle = useCallback((x: number, y: number) => {
    const currentGrid = cases[activeCaseIdx]?.grid || {};
    const key = `${x},${y}`;
    const current = currentGrid[key];

    let next: GridItem['type'] | undefined;
    if (!current) next = 'student';
    else if (current === 'student') next = 'teacher';
    else if (current === 'teacher') next = 'obstacle';
    else if (current === 'obstacle') next = 'door';
    else next = undefined; // Cycle to empty

    updateGridCell(x, y, next, handleRemoveLiveStatus);
  }, [cases, activeCaseIdx, updateGridCell, handleRemoveLiveStatus]);

  const onHandleBulkReset = () => {
    const ok = bulkResetLiveStatuses();
    if (ok) {
      sendTeacherResetBroadcast();
    }
  };

  const onHandleToggleSeatLock = () => {
    const nextLocked = toggleSeatLock();
    sendTeacherLockStateBroadcast(nextLocked);
  };

  const handleToggleActive = async () => {
    const nextActive = !isActive;
    setIsActive(nextActive);

    try {
      await client.api.rooms[':id'].status.$patch({
        param: { id: roomId! },
        json: {
          isActive: nextActive,
        },
      });
      addToast('success', nextActive ? 'チェックインの受付を開始しました（オープン）' : 'チェックインの受付を停止しました（クローズ）');
    } catch (err: any) {
      addToast('error', `ステータス更新に失敗しました: ${err.message}`);
    }
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| 教員用監視</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn">
            <Sliders size={16} /> 教室設定
          </Link>
          <Link to="/seating" className="mode-toggle-btn active">
            <MonitorPlay size={16} /> 教員用監視
          </Link>
          <Link to="/user/student" className="mode-toggle-btn">
            <Users size={16} /> 学生名簿
          </Link>
          <Link to="/user/teacher" className="mode-toggle-btn">
            <ShieldAlert size={16} /> 教員一覧
          </Link>
          <button onClick={handleLogout} className="mode-toggle-btn" style={{ marginLeft: '1rem', color: 'var(--color-obstacle)' }}>
            <LogOut size={16} /> ログアウト
          </button>
        </div>

        <div className="header-status">
          <span className={`supabase-badge ${supabase ? '' : 'disconnected'}`}>
             {supabase ? 'Realtime 有効' : 'Supabase 未接続'}
          </span>
        </div>
      </header>

      <main 
        className="main-content" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1rem 2rem', 
          gap: '1rem', 
          width: '100%', 
          maxWidth: '100%',
          ['--min-cell-width' as any]: `${minWidth}px`,
          ['--min-cell-height' as any]: `${minHeight}px`
        }}
      >
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          
          {/* Left: Room & Case Selection and Monitor Controls */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1, alignItems: 'center' }}>
            <div className="card" style={{ padding: '0.75rem 1rem', flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FolderOpen size={20} />
              <select 
                className="text-input" 
                value={roomId || ''} 
                onChange={(e) => loadClassroom(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">教室を選択してください</option>
                {savedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            {/* Monitor Controls (Lock/Reset) */}
            {roomId && (
               <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <button className={`btn ${isSeatLocked ? 'btn-danger' : 'btn-primary'}`} style={{ padding: '0.5rem 1rem' }} onClick={onHandleToggleSeatLock}>
                    {isSeatLocked ? <><Lock size={16}/> 座座ロック解除</> : <><Unlock size={16}/> 全員着席（ロック）</>}
                 </button>
                 <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={onHandleBulkReset}>
                    <RotateCcw size={16}/> 状態一括クリア
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
                     backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                     border: isActive ? '1px solid #10b981' : '1px solid #ef4444',
                     color: isActive ? '#10b981' : '#ef4444',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem'
                   }} 
                   onClick={handleToggleActive}
                 >
                   {isActive ? '● 受付中 (Open)' : '○ クローズ (Closed)'}
                 </button>
               </div>
            )}
          </div>

        </div>

        {/* Main Massive Grid / Placeholder */}
        {roomId ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginTop: '1rem', flex: 1, gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <SeatMap
                grid={cases[activeCaseIdx]?.grid}
                liveStatuses={liveStatuses}
                onCycle={() => {}}
                massive={true}
              />
            </div>

            {/* Permanent Settings & QR Drawer at the bottom */}
            <div 
              className="card" 
              style={{ 
                width: '100%', 
                padding: '1.5rem', 
                display: 'flex', 
                gap: '2rem', 
                background: 'rgba(20, 27, 45, 0.6)', 
                backdropFilter: 'blur(16px)',
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
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API URL</label>
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
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ANON KEY</label>
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
                  onClick={async () => { saveSupabaseConfig(); if(roomId) await saveClassroom(); }}
                >
                  設定を保存して接続
                </button>
              </div>

              {/* Vertical Divider */}
              <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

              {/* Right side: Conditionally show Student QR Code or setup guide */}
              {supabaseUrl && supabaseUrl.trim() !== '' && !supabaseUrl.includes('temp-placeholder') ? (
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
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
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
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>Supabase 接続未設定</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '320px', lineHeight: 1.4 }}>
                    左側のフォームに有効な Supabase 設定を入力し「設定を保存して接続」ボタンをクリックすると、ここに学生用のチェックインQRコードが自動生成されます。
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem 2rem', textAlign: 'center', background: 'rgba(20, 27, 45, 0.4)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-student)', marginBottom: '1.5rem' }}>
                <MonitorPlay size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>ライブ監視を開始</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                上部のメニューから教室を選択して、リアルタイムの授業理解度（OK/NG状況やコメント）の監視を開始してください。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
