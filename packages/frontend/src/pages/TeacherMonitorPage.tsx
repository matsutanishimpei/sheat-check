import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DragEndEvent } from '@dnd-kit/core';
import { useRoomLayout } from '../hooks/useRoomLayout';
import { useSeatManager } from '../hooks/useSeatManager';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { TeacherView } from '../containers/TeacherView';
import { LiveSeatStatus, GridItem } from '@my-app/shared';
import { LogOut, Sliders, MonitorPlay, FolderOpen, Lock, Unlock, RotateCcw, Database, ChevronUp, ChevronDown, QrCode, Users, ShieldAlert, Download, Trash2, Activity } from 'lucide-react';
import { SeatMap } from '../components/SeatMap';
import client from '../lib/hc';
import { generateCSVContent } from '../lib/csvHelper';

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

  // Single Source of Truth for Seat Management (Statuses & Lock States)
  const {
    liveStatuses,
    setLiveStatuses,
    isSeatLocked,
    toggleSeatLock,
    bulkResetLiveStatuses,
    removeLiveStatus,
  } = useSeatManager({
    roomId,
    addToast,
  });

  const [teacherToken] = useState(() => localStorage.getItem('supabase_teacher_token') || '');

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
    setLiveStatuses, // Feed the unified setLiveStatuses from useSeatManager
    addToast,
    onTeacherReset: () => bulkResetLiveStatuses(),
    onTeacherLockState: () => toggleSeatLock(),
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
    authToken: teacherToken,
  });

  // Auto-restore active room ID across navigation
  useEffect(() => {
    if (!roomId && savedRooms.length > 0) {
      const activeRoomId = localStorage.getItem('active_teacher_room_id');
      if (activeRoomId && savedRooms.some(r => r.id === activeRoomId)) {
        handleLoadClassroom(activeRoomId);
      }
    }
  }, [roomId, savedRooms]);

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

  const handleLoadClassroom = async (id: string) => {
    if (!id) {
      loadClassroom('');
      return;
    }

    const storageKey = `class_responses_room_${id}`;
    const dateKey = `class_responses_date_room_${id}`;
    const lastSavedDateStr = localStorage.getItem(dateKey);
    const hasHistory = localStorage.getItem(storageKey) !== null;

    if (hasHistory && lastSavedDateStr) {
      const todayStr = new Date().toDateString();
      if (lastSavedDateStr !== todayStr) {
        try {
          const formattedDate = new Date(lastSavedDateStr).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          });

          const confirmClear = window.confirm(
            `【異なる講義日の履歴を検知】\n前回（${formattedDate}）の質問回答履歴がブラウザに残っています。\n\n本日の新しい講義を開始するために、前回の履歴をクリアしますか？\n（※まだCSVを出力していない場合は「キャンセル」を押して、先にCSVをダウンロードしてください）`
          );

          if (confirmClear) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(dateKey);
            addToast('success', '前回の質問履歴をクリアし、本日の新しい講義セッションを開始しました。');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    loadClassroom(id);
  };

  const archiveCurrentStatuses = useCallback(() => {
    if (!roomId) return;
    
    const currentResponses: Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }> = {};
    let hasData = false;
    
    Object.keys(liveStatuses).forEach((seatId) => {
      const live = liveStatuses[seatId];
      if (live && live.studentId && live.status && live.status !== 'none') {
        currentResponses[live.studentId] = {
          name: live.name,
          status: live.status as 'ok' | 'ng',
          responseTime: live.responseTime,
          comment: live.comment || undefined,
        };
        hasData = true;
      }
    });

    if (!hasData) return;

    const timeLabel = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sessionKey = `質問_${timeLabel}`;

    const storageKey = `class_responses_room_${roomId}`;
    let saved: Record<string, any> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    saved[sessionKey] = currentResponses;
    localStorage.setItem(storageKey, JSON.stringify(saved));
    // Record today's date stamp so we can suggest resets on different days
    localStorage.setItem(`class_responses_date_room_${roomId}`, new Date().toDateString());
  }, [roomId, liveStatuses]);

  const onHandleBulkReset = () => {
    // 状態をクリアする前に、現在の回答を質問履歴にアーカイブ
    archiveCurrentStatuses();

    const ok = bulkResetLiveStatuses();
    if (ok) {
      sendTeacherResetBroadcast();
      addToast('success', '前の回答を質問履歴に保存し、新しい質問を開始しました！');
    }
  };

  const handleExportCSV = useCallback(() => {
    if (!roomId) return;

    const storageKey = `class_responses_room_${roomId}`;
    let saved: Record<string, Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }>> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    // 現在進行中の未クリアの回答も最後に追加
    const currentResponses: Record<string, { name: string; status: 'ok' | 'ng'; responseTime?: number; comment?: string }> = {};
    let hasCurrent = false;
    Object.keys(liveStatuses).forEach((seatId) => {
      const live = liveStatuses[seatId];
      if (live && live.studentId && live.status && live.status !== 'none') {
        currentResponses[live.studentId] = {
          name: live.name,
          status: live.status as 'ok' | 'ng',
          responseTime: live.responseTime,
          comment: live.comment || undefined,
        };
        hasCurrent = true;
      }
    });

    const finalSessions = { ...saved };
    if (hasCurrent) {
      finalSessions['現在進行中'] = currentResponses;
    }

    const sessionKeys = Object.keys(finalSessions);
    if (sessionKeys.length === 0) {
      addToast('warning', '出力する回答データがありません。');
      return;
    }

    // 全学生（学籍番号）の集計
    const studentMap: Record<string, { name: string; responses: Record<string, any> }> = {};

    sessionKeys.forEach((sKey) => {
      const sessionData = finalSessions[sKey];
      Object.keys(sessionData).forEach((studentId) => {
        const resp = sessionData[studentId];
        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            name: resp.name,
            responses: {},
          };
        }
        studentMap[studentId].responses[sKey] = resp;
      });
    });

    const studentIds = Object.keys(studentMap).sort();
    if (studentIds.length === 0) {
      addToast('warning', '出力する回答データがありません。');
      return;
    }

    // CSV作成（エクセル文字化け対策BOM付き）
    const csvContent = generateCSVContent(sessionKeys, studentMap);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
    link.setAttribute('download', `回答ログ_${roomName || '教室'}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('success', '回答ログ（CSV）をダウンロードしました！');
  }, [roomId, liveStatuses, roomName, addToast]);

  const handleClearSavedResponses = useCallback(() => {
    if (!roomId) return;
    if (window.confirm('これまでに保存された本日のすべての質問履歴をクリアしますか？\n（現在の座席上のステータスはリセットされません）')) {
      localStorage.removeItem(`class_responses_room_${roomId}`);
      addToast('success', '質問履歴をクリアしました。');
    }
  }, [roomId, addToast]);

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
      console.error(`ステータス更新に失敗しました: ${err.message}`);
    }
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', minWidth: '1280px' }}>
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| みんなの様子</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn">
            <Sliders size={16} /> 教室設定
          </Link>
          <Link to="/seats/monitoring" className="mode-toggle-btn active">
            <MonitorPlay size={16} /> みんなの様子
          </Link>
          <Link to="/student/monitoring" className="mode-toggle-btn">
            <Users size={16} /> 学生名簿
          </Link>
          <Link to="/user/teacher" className="mode-toggle-btn">
            <ShieldAlert size={16} /> 教員一覧
          </Link>
          <button onClick={handleLogout} className="mode-toggle-btn" style={{ marginLeft: '1rem', color: 'var(--color-obstacle)' }}>
            <LogOut size={16} /> ログアウト
          </button>
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
                onChange={(e) => handleLoadClassroom(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">教室を選択してください</option>
                {savedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            {/* Monitor Controls (Lock/Reset) */}
            {roomId && (
               <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                 <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={onHandleBulkReset} title="現在の学生の回答状態を履歴に保存し、全員의回答状況をクリアして新しい質問を開始します。">
                    <RotateCcw size={16}/> みんなの回答をクリア
                 </button>
                 <button className="btn btn-success" style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={handleExportCSV}>
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
                   onClick={handleClearSavedResponses}
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
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '1rem', flex: 1, gap: '2rem' }}>
            
            {/* Vertical Layout: SeatMap on Top, Realtime Logs on Bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'flex-start' }}>
              
              {/* Top: SeatMap (Clean container fit with auto-scroll if too wide) */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <SeatMap
                  grid={cases[activeCaseIdx]?.grid}
                  liveStatuses={liveStatuses}
                  onCycle={() => {}}
                  massive={true}
                />
              </div>

              {/* Bottom: Realtime Logs (Expanded to full screen width to align with SeatMap) */}
              <div className="card" style={{ width: '100%', maxWidth: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: '320px', maxHeight: '480px' }}>
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Activity size={18} style={{ color: 'var(--color-student)' }} /> リアルタイム質問・コメント
                </h2>
                {(() => {
                  const commentLogs = [...realtimeLogs.filter(log => log.comment && log.comment.trim() !== '')].reverse();
                  return commentLogs.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '2rem' }}>📡</span>
                      <p style={{ fontSize: '0.85rem', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                        学生からのコメントや質問を<br />リアルタイムに待機しています...
                      </p>
                    </div>
                  ) : (
                    <div className="activity-feed-container" style={{ flex: 1, overflowY: 'scroll', maxHeight: '380px', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {commentLogs.map((log) => (
                        <div key={log.id} className={`feed-item ${log.status}`} style={{ margin: 0 }}>
                          <div className="feed-item-header">
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.studentName} ({log.seatId})</span>
                          </div>
                          <span className="feed-item-comment" style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: 'var(--text-primary)', display: 'block', padding: '0.35rem 0.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '4px', borderLeft: '2.5px solid var(--color-student)', fontStyle: 'normal', lineHeight: '1.4' }}>
                            {log.comment}
                          </span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span>学籍: {log.studentId || '-'}</span>
                            <span>{log.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Permanent Settings & QR Drawer at the bottom */}
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
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f59e0b' }}>Supabase 接続未設定</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '320px', lineHeight: 1.4 }}>
                    左側のフォームに有効な Supabase 設定を入力し「設定を保存して接続」ボタンをクリックすると、ここに学生用のチェックインQRコードが自動生成されます。
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-student)', marginBottom: '1.5rem' }}>
                <MonitorPlay size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>ライブ監視を開始</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                上部のメニューから教室を選択して、リアルタイムの授業理解度（OK/NG状況やコメント）の監視を開始してください。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
