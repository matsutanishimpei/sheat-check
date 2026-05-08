import React, { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { useRoomLayout } from '../hooks/useRoomLayout';
import { useSeatManager } from '../hooks/useSeatManager';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { TeacherView } from '../containers/TeacherView';
import { LiveSeatStatus, GridItem } from '@my-app/shared';

interface TeacherPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const TeacherPage: React.FC<TeacherPageProps> = ({ addToast }) => {
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
    applyRowPreset,
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

  const {
    supabase,
    realtimeLogs,
    isOnline,
    saveSupabaseConfig,
    sendTeacherResetBroadcast,
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

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check</h1>
        </div>

        <div className="header-status">
          <span className={`supabase-badge ${supabase ? '' : 'disconnected'}`}>
             {supabase ? 'Realtime 有効' : 'Supabase 未接続'}
          </span>
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
            await saveClassroom();
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
        onApplyRowPreset={applyRowPreset}
        onBulkReset={onHandleBulkReset}
        onSaveClassroom={saveClassroom}
        isSaving={isSaving}
        onDragEnd={handleDragEnd}
        onCellCycle={handleCellCycle}
        liveStatuses={liveStatuses}
      />
    </div>
  );
};
