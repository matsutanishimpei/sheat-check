import React, { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { 
  Users, 
  GraduationCap, 
  Grid3X3,
  Database
} from 'lucide-react';
import client from './lib/hc';
import { GridItem } from '@my-app/shared';
import './index.css';

// Import custom components
import { ToastList, ToastMessage } from './components/ToastList';
import { StudentView } from './containers/StudentView';
import { TeacherView } from './containers/TeacherView';

// Import custom hooks & types
import { useRoomLayout } from './hooks/useRoomLayout';
import { useSeatManager } from './hooks/useSeatManager';
import { useRealtimeSession } from './hooks/useRealtimeSession';



/* ==========================================================================
   Main App Component
   ========================================================================== */
const App = () => {
  // Navigation / View state
  const [viewMode, setViewMode] = useState<'teacher' | 'student'>('teacher');

  // Student specific wizard state: 'config' (setup) -> 'select' (choose seat) -> 'dashboard' (reporting)
  const [studentStage, setStudentStage] = useState<'config' | 'select' | 'dashboard'>('config');
  const [studentClassroomId, setStudentClassroomId] = useState(() => localStorage.getItem('last_room_id') || '');
  const [studentName, setStudentName] = useState('');
  const [studentSeatId, setStudentSeatId] = useState('');
  const [studentComment, setStudentComment] = useState('');
  const [studentGridLayout, setStudentGridLayout] = useState<Record<string, GridItem['type']>>({});
  const [studentRoomTitle, setStudentRoomTitle] = useState('');
  const [studentLiveSeatLocked, setStudentLiveSeatLocked] = useState(false);

  // Supabase states managed at the root component to prevent circular dependency TDZ errors
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('sb_url') || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('sb_key') || '');

  // UI state for Toast messages
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show status toasts
  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 1. Classroom layout state & API operations (D1 / Hono)
  const {
    roomName,
    setRoomName,
    roomId,
    setRoomId,
    cases,
    setCases,
    activeCaseIdx,
    setActiveCaseIdx,
    savedRooms,
    isLoadingRooms,
    isSaving,
    fetchRooms,
    loadClassroom,
    saveClassroom,
    createNewClassroomSession,
    addNewCase,
    deleteCurrentCase,
    updateActiveCaseName,
    updateGridCell,
    clearCurrentGrid,
    applyRowPreset,
  } = useRoomLayout({
    addToast,
    onClearLiveStatuses: () => setLiveStatuses({}),
    supabaseUrl,
    supabaseAnonKey,
    setSupabaseUrl,
    setSupabaseAnonKey,
  });

  // 2. Teacher Seat Management & Local Persistence (localStorage)
  const {
    liveStatuses,
    setLiveStatuses,
    isSeatLocked,
    setIsSeatLocked,
    removeLiveStatus,
    bulkResetLiveStatuses,
    toggleSeatLock,
  } = useSeatManager({
    roomId,
    addToast,
  });

  // 3. Realtime Supabase sessions & log feeds (Supabase Broadcast)
  const {
    supabase,
    saveSupabaseConfig,
    realtimeLogs,
    setRealtimeLogs,
    isOnline,
    sendStudentToTeacherBroadcast,
    sendTeacherResetBroadcast,
    sendTeacherLockStateBroadcast,
  } = useRealtimeSession({
    roomId,
    studentClassroomId,
    isSeatLocked,
    setLiveStatuses,
    addToast,
    onTeacherReset: () => {
      localStorage.removeItem(`student_seat_id_${studentClassroomId}`);
      localStorage.removeItem(`student_name_${studentClassroomId}`);
      setStudentSeatId('');
      setStudentName('');
      setStudentComment('');
      setStudentStage('config');
      addToast('info', '教員によって座席情報がリセットされました。再登録してください。');
    },
    onTeacherLockState: (locked) => {
      setStudentLiveSeatLocked(locked);
      if (locked) {
        addToast('warning', '教員によって学生の座席変更がロックされました');
      } else {
        addToast('info', '教員によって座席ロックが解除されました');
      }
    },
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
  });

  // Wrapper functions for UI triggers
  const handleBulkReset = () => {
    const ok = bulkResetLiveStatuses();
    if (ok) {
      setRealtimeLogs([]);
      sendTeacherResetBroadcast();
    }
  };
  const handleToggleSeatLock = () => {
    const nextLocked = toggleSeatLock();
    sendTeacherLockStateBroadcast(nextLocked);
  };

  /* ==========================================================================
     Student Stage Handlers (Login & Grid Locks)
     ========================================================================== */
  // Handle auto-login and metadata fetch via URL query parameter (?room=UUID) on app load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      const cleanUuid = roomParam.trim();
      setStudentClassroomId(cleanUuid);
      setViewMode('student');

      const storedName = localStorage.getItem(`student_name_${cleanUuid}`);
      const storedSeatId = localStorage.getItem(`student_seat_id_${cleanUuid}`);

      if (storedName) {
        setStudentName(storedName);
        if (storedSeatId) {
          setStudentSeatId(storedSeatId);
        }
      }

      // Fetch room metadata and Supabase config regardless of name presence (crucial for first-time students!)
      const fetchRoomAndSetup = async () => {
        try {
          const res = await client.api.rooms[':id'].$get({
            param: { id: cleanUuid },
          });
          if (res.ok) {
            const data = await res.json();
            setStudentRoomTitle(data.name);
            
            if (data.supabaseUrl && data.supabaseAnonKey) {
              setSupabaseUrl(data.supabaseUrl);
              setSupabaseAnonKey(data.supabaseAnonKey);
            } else {
              addToast('error', 'この教室はまだ教員による Supabase 接続設定が保存されていません。教員に確認してください。');
            }

            const firstLayout = data.layouts[0];
            const gridObj: Record<string, GridItem['type']> = {};
            if (firstLayout && firstLayout.grid) {
              firstLayout.grid.forEach((item: GridItem) => {
                gridObj[`${item.x},${item.y}`] = item.type;
              });
            }
            setStudentGridLayout(gridObj);

            if (storedName) {
              if (storedSeatId) {
                setStudentStage('dashboard');
                addToast('success', `教室「${data.name}」の固定席 (${storedSeatId}) に自動チェックインしました！`);
              } else {
                setStudentStage('select');
                addToast('info', `教室「${data.name}」の座席選択画面へ進みます`);
              }
            } else {
              addToast('info', `教室「${data.name}」への招待リンクをロードしました。お名前を入力して入室してください！`);
            }
          } else {
            addToast('error', '指定された招待リンクの教室が見つかりませんでした。');
          }
        } catch (err: any) {
          console.error('URL setup failed:', err);
          addToast('error', `教室データの取得エラー: ${err.message}`);
        }
      };

      fetchRoomAndSetup();
    }
  }, [addToast, setSupabaseUrl, setSupabaseAnonKey]);

  const handleStudentLogin = async () => {
    if (!studentClassroomId.trim()) {
      addToast('error', '教室の UUID を入力してください');
      return;
    }
    if (!studentName.trim()) {
      addToast('error', 'お名前を入力してください');
      return;
    }

    try {
      // 1. Load room structure from D1 via Hono RPC API
      const res = await client.api.rooms[':id'].$get({
        param: { id: studentClassroomId.trim() },
      });

      if (res.ok) {
        const data = await res.json();
        setStudentRoomTitle(data.name);

        // Fetch Supabase configuration set by Teacher
        if (data.supabaseUrl && data.supabaseAnonKey) {
          setSupabaseUrl(data.supabaseUrl);
          setSupabaseAnonKey(data.supabaseAnonKey);
        } else {
          addToast('warning', 'この教室は Supabase 接続設定がまだ完了していません。教員が設定を保存するまでブロードキャストが使えません。');
        }

        // Fetch Case 1 grid structure
        const firstLayout = data.layouts[0];
        const gridObj: Record<string, GridItem['type']> = {};
        if (firstLayout && firstLayout.grid) {
          firstLayout.grid.forEach((item: GridItem) => {
            gridObj[`${item.x},${item.y}`] = item.type;
          });
        }
        setStudentGridLayout(gridObj);

        // 2. Persist room id globally
        localStorage.setItem('last_room_id', studentClassroomId.trim());

        // 3. Check if we already have a locked seat coordinate in local storage
        const storedSeatId = localStorage.getItem(`student_seat_id_${studentClassroomId.trim()}`);
        const storedName = localStorage.getItem(`student_name_${studentClassroomId.trim()}`);

        if (storedSeatId && storedName) {
          setStudentSeatId(storedSeatId);
          setStudentName(storedName);
          setStudentStage('dashboard');
          addToast('success', `前回の固定席 (${storedSeatId}) を自動ロードしました`);
        } else {
          setStudentStage('select');
          addToast('info', `ようこそ！「${data.name}」の空席から、あなたの席を選択してください`);
        }
      } else {
        addToast('error', '指定された UUID の教室が見つかりません。入力内容を確認してください。');
      }
    } catch (err: any) {
      addToast('error', `サーバー接続エラー: ${err.message}`);
    }
  };

  // Confirm seat selection and persist to localStorage (Fixed Seat Lock)
  const handleLockSeat = () => {
    if (!studentSeatId) {
      addToast('error', '座席図から自分の席を選択してください');
      return;
    }

    localStorage.setItem(`student_seat_id_${studentClassroomId}`, studentSeatId);
    localStorage.setItem(`student_name_${studentClassroomId}`, studentName);
    setStudentStage('dashboard');
    addToast('success', `座席「${studentSeatId}」に固定登録（ロック）しました！`);
  };

  // Change seat back to select mode (Only available when Teacher's seatLock is false!)
  const handleChangeSeat = async () => {
    if (studentLiveSeatLocked) {
      addToast('error', '現在、教員によって座席の変更が制限されています');
      return;
    }

    if (!window.confirm('現在の座席設定を解除して選び直しますか？')) {
      return;
    }

    const previousSeatId = studentSeatId;

    // Send a broadcast to clear the previous seat on the teacher's board
    if (previousSeatId) {
      sendStudentToTeacherBroadcast(previousSeatId, 'none', studentName);
    }

    // Erase seatId from state & localStorage, but KEEP studentName!
    setStudentSeatId('');
    localStorage.removeItem(`student_seat_id_${studentClassroomId}`);
    setStudentStage('select');
    addToast('info', '座席の固定を解除しました。新しい席を選択してください。');
  };

  /* ==========================================================================
     Student Broadcast Action Logic
     ========================================================================== */
  const sendStudentBroadcast = async (status: 'ok' | 'ng') => {
    if (!studentClassroomId.trim() || !studentSeatId || !studentName.trim()) {
      addToast('error', 'セッションが無効です。最初の画面からやり直してください。');
      setStudentStage('config');
      return;
    }

    const result = await sendStudentToTeacherBroadcast(
      studentSeatId,
      status,
      studentName,
      studentComment
    );

    if (result === 'ok') {
      addToast('success', `理解状況「${status.toUpperCase()}」を教員に送信しました！`);
    } else {
      addToast('error', 'ブロードキャスト通信の送信に失敗しました。Supabase の設定等をご確認ください。');
    }
  };

  /* ==========================================================================
     Teacher Layout Editor Logics
     ========================================================================== */
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
    else next = undefined; // Empty

    updateGridCell(x, y, next, removeLiveStatus);
  }, [cases, activeCaseIdx, updateGridCell, removeLiveStatus]);

  return (
    <div className="app-container">
      {/* Dynamic Header */}
      <header className="header">
        <div className="logo-group">
          <Grid3X3 className="logo-icon pulse" size={26} />
          <h1 className="logo-text">SeatCheck Studio</h1>
          <span className="logo-badge">Lock Studio</span>
        </div>

        {/* View Mode Switcher Header Button */}
        <div className="mode-toggle-group">
          <button
            onClick={() => setViewMode('teacher')}
            className={`mode-toggle-btn ${viewMode === 'teacher' ? 'active' : ''}`}
          >
            <GraduationCap size={16} /> 教員画面 (Teacher)
          </button>
          <button
            onClick={() => {
              setViewMode('student');
              if (roomId) setStudentClassroomId(roomId);
            }}
            className={`mode-toggle-btn ${viewMode === 'student' ? 'active' : ''}`}
          >
            <Users size={16} /> 学生画面 (Student)
          </button>
        </div>

        <div className="header-status">
          <span className={`supabase-badge ${supabase ? '' : 'disconnected'}`}>
            <Database size={12} /> {supabase ? 'Supabase Realtime 有効' : 'Supabase 未接続'}
          </span>
        </div>
      </header>

      {/* Conditional Rendering based on ViewMode */}
      {viewMode === 'teacher' ? (
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
          onToggleSeatLock={handleToggleSeatLock}
          onClearGrid={clearCurrentGrid}
          onApplyRowPreset={applyRowPreset}
          onBulkReset={handleBulkReset}
          onSaveClassroom={saveClassroom}
          isSaving={isSaving}
          onDragEnd={handleDragEnd}
          onCellCycle={handleCellCycle}
          liveStatuses={liveStatuses}
        />
      ) : (
        <StudentView
          supabase={supabase}
          studentStage={studentStage}
          setStudentStage={setStudentStage}
          studentClassroomId={studentClassroomId}
          setStudentClassroomId={setStudentClassroomId}
          studentName={studentName}
          setStudentName={setStudentName}
          studentSeatId={studentSeatId}
          setStudentSeatId={setStudentSeatId}
          studentComment={studentComment}
          setStudentComment={setStudentComment}
          studentRoomTitle={studentRoomTitle}
          studentLiveSeatLocked={studentLiveSeatLocked}
          studentGridLayout={studentGridLayout}
          onStudentLogin={handleStudentLogin}
          onLockSeat={handleLockSeat}
          onChangeSeat={handleChangeSeat}
          onSendBroadcast={sendStudentBroadcast}
          addToast={addToast}
        />
      )}

      {/* Screen Notifications Toast Alerts */}
      <ToastList toasts={toasts} />
    </div>
  );
};

export default App;
