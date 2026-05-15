import React, { useEffect } from 'react';
import { LogOut, MonitorPlay, FolderOpen, RotateCcw, Database, QrCode, Download, Trash2, Activity, LayoutGrid, Radio, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useTeacherSession } from '../hooks/useTeacherSession';
import { useResponseArchive } from '../hooks/useResponseArchive';
import { SeatMap } from '../components/SeatMap';
import client from '../lib/hc';
import { responseArchive } from '../lib/storage';
import { useRequireAuth, useLogout } from '../hooks/useRequireAuth';
import { TeacherHeader } from '../components/layout/TeacherHeader';
import { MonitorControlBar } from '../components/monitor/MonitorControlBar';
import { MonitorRealtimeLogs } from '../components/monitor/MonitorRealtimeLogs';
import { MonitorSettingsDrawer } from '../components/monitor/MonitorSettingsDrawer';

export const TeacherMonitorPage: React.FC = () => {
  useRequireAuth();
  const handleLogout = useLogout();
  const { addToast } = useToast();

  const minWidth = import.meta.env.VITE_MONITOR_CELL_MIN_WIDTH || '80';
  const minHeight = import.meta.env.VITE_MONITOR_CELL_MIN_HEIGHT || '40';

  const session = useTeacherSession();

  const {
    archiveCurrentStatuses,
    handleExportCSV,
    handleClearSavedResponses,
  } = useResponseArchive(session.roomId, session.roomName, session.liveStatuses);

  // ── Classroom loading with day-change history detection ──
  const handleLoadClassroom = async (id: string) => {
    if (!id) {
      session.loadClassroom('');
      return;
    }

    const lastSavedDateStr = responseArchive.getDate(id);
    const hasHistory = responseArchive.get(id) !== null;

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
            responseArchive.remove(id);
            responseArchive.removeDate(id);
            addToast('success', '前回の質問履歴をクリアし、本日の新しい講義セッションを開始しました。');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    session.loadClassroom(id);
  };

  const onHandleBulkReset = () => {
    archiveCurrentStatuses();
    const ok = session.handleBulkReset();
    if (ok) {
      addToast('success', '前の回答を質問履歴に保存し、新しい質問を開始しました！');
    }
  };

  const handleToggleActive = async () => {
    const nextActive = !session.isActive;
    session.setIsActive(nextActive);

    try {
      await client.api.rooms[':id'].status.$patch({
        param: { id: session.roomId! },
        json: { isActive: nextActive },
      });
      addToast('success', nextActive ? 'チェックインの受付を開始しました（オープン）' : 'チェックインの受付を停止しました（クローズ）');
    } catch (err: any) {
      console.error(`ステータス更新に失敗しました: ${err.message}`);
    }
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', minWidth: '1280px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 0) 50%)' }}>
      <TeacherHeader activePage="monitor" subtitle="みんなの様子" onLogout={handleLogout} />

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
        <MonitorControlBar 
          savedRooms={session.savedRooms}
          roomId={session.roomId}
          isActive={session.isActive}
          onLoadClassroom={handleLoadClassroom}
          onBulkReset={onHandleBulkReset}
          onExportCSV={handleExportCSV}
          onClearSavedResponses={handleClearSavedResponses}
          onToggleActive={handleToggleActive}
        />

        {/* Main Massive Grid / Placeholder */}
        {session.roomId ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '1rem', flex: 1, gap: '2rem' }}>
            
            {/* Vertical Layout: SeatMap on Top, Realtime Logs on Bottom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'flex-start' }}>
              
              {/* Top: SeatMap */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <SeatMap
                  grid={session.cases[session.activeCaseIdx]?.grid}
                  liveStatuses={session.liveStatuses}
                  onCycle={() => {}}
                  massive={true}
                />
              </div>

              {/* Bottom: Realtime Logs */}
              <MonitorRealtimeLogs realtimeLogs={session.realtimeLogs} />

            </div>

            {/* Permanent Settings & QR Drawer at the bottom */}
            <MonitorSettingsDrawer 
              roomId={session.roomId}
              supabaseUrl={session.supabaseUrl}
              supabaseAnonKey={session.supabaseAnonKey}
              setSupabaseUrl={session.setSupabaseUrl}
              setSupabaseAnonKey={session.setSupabaseAnonKey}
              onSaveSupabaseConfig={session.saveSupabaseConfig}
            />
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
