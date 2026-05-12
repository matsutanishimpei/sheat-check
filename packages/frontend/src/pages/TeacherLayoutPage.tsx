import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DragEndEvent } from '@dnd-kit/core';
import { useRoomLayout } from '../hooks/useRoomLayout';
import { useSeatManager } from '../hooks/useSeatManager';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { TeacherView } from '../containers/TeacherView';
import { LiveSeatStatus, GridItem } from '@my-app/shared';
import { LogOut, Sliders, MonitorPlay, Users, ShieldAlert } from 'lucide-react';

interface TeacherLayoutPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const TeacherLayoutPage: React.FC<TeacherLayoutPageProps> = ({ addToast }) => {
  const navigate = useNavigate();

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
    fetchRooms,
    clearCurrentGrid,
    updateGridCell,
    deleteClassroom,
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active) return;

    const dragType = active.data.current?.type as GridItem['type'];
    const { x, y } = over.data.current as { x: number; y: number };

    if (dragType && typeof x === 'number' && typeof y === 'number') {
      updateGridCell(x, y, dragType, removeLiveStatus);
    }
  }, [updateGridCell, removeLiveStatus]);

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

    updateGridCell(x, y, next, removeLiveStatus);
  }, [cases, activeCaseIdx, updateGridCell, removeLiveStatus]);

  const [teacherToken] = useState(() => localStorage.getItem('supabase_teacher_token') || '');

  const {
    supabase,
    realtimeLogs,
    isOnline,
    saveSupabaseConfig,
    sendTeacherResetBroadcast,
    sendTeacherLockStateBroadcast,
    sendRoomLayoutUpdatedBroadcast,
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
    authToken: teacherToken,
  });

  // Auto-restore active room ID across navigation
  useEffect(() => {
    if (!roomId && savedRooms.length > 0) {
      const activeRoomId = localStorage.getItem('active_teacher_room_id');
      if (activeRoomId && savedRooms.some(r => r.id === activeRoomId)) {
        loadClassroom(activeRoomId);
      }
    }
  }, [roomId, savedRooms]);

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

  const onHandleSaveClassroom = async () => {
    await saveClassroom();
    // Notify all students in real-time that room layout has updated
    setTimeout(() => {
      sendRoomLayoutUpdatedBroadcast();
    }, 800);
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| 教室設定</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn active">
            <Sliders size={16} /> 教室設定
          </Link>
           <Link to="/seats/monitoring" className="mode-toggle-btn">
            <MonitorPlay size={16} /> 教員用監視
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

      <TeacherView
        supabase={supabase}
        supabaseUrl={supabaseUrl}
        setSupabaseUrl={setSupabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
        setSupabaseAnonKey={setSupabaseAnonKey}
        onSaveSupabaseConfig={async () => {
          saveSupabaseConfig();
          if (roomId) {
            await onHandleSaveClassroom();
          }
        }}
        roomName={roomName}
        setRoomName={setRoomName}
        onCreateNewSession={createNewClassroomSession}
        cases={cases}
        activeCaseIdx={activeCaseIdx}
        setActiveCaseIdx={setActiveCaseIdx}
        onUpdateActiveCaseName={updateActiveCaseName}
        onAddNewCase={addNewCase}
        onDeleteCurrentCase={deleteCurrentCase}
        isLoadingRooms={isLoadingRooms}
        savedRooms={savedRooms}
        roomId={roomId}
        onLoadClassroom={loadClassroom}
        onFetchRooms={fetchRooms}
        realtimeLogs={realtimeLogs}
        isSeatLocked={isSeatLocked}
        onToggleSeatLock={onHandleToggleSeatLock}
        onClearGrid={clearCurrentGrid}
        onBulkReset={onHandleBulkReset}
        onSaveClassroom={onHandleSaveClassroom}
        onDeleteClassroom={deleteClassroom}
        isSaving={isSaving}
        onDragEnd={handleDragEnd}
        onCellCycle={handleCellCycle}
        liveStatuses={liveStatuses}
      />
    </div>
  );
};
