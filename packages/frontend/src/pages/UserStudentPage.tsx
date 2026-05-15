import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Search, Filter, Download, Trash2, CheckCircle, AlertCircle, RefreshCw, LayoutGrid } from 'lucide-react';
import client from '../lib/hc';
import { LiveSeatStatus } from '@my-app/shared';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../contexts/ToastContext';
import { seatStatuses as seatStorage } from '../lib/storage';
import { useRequireAuth, useLogout } from '../hooks/useRequireAuth';
import { TeacherHeader } from '../components/layout/TeacherHeader';
import { StudentStatsWidgets } from '../components/student/StudentStatsWidgets';
import { StudentListToolbar } from '../components/student/StudentListToolbar';
import { StudentListTable } from '../components/student/StudentListTable';

export interface UserRecord {
  roomId: string;
  roomName: string;
  seatId: string;
  name: string;
  status: 'ok' | 'ng' | 'none';
  comment?: string;
}

export const UserStudentPage: React.FC = () => {
  useRequireAuth();
  const handleLogout = useLogout();
  const { addToast } = useToast();

  const [savedRooms, setSavedRooms] = useState<{ id: string; name: string }[]>([]);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ok' | 'ng'>('all');

  // Load classrooms and extract local storage statuses
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const res = await client.api.rooms.$get();
      if (res.ok) {
        const data = await res.json();
        const rooms = data.rooms || [];
        setSavedRooms(rooms);

        // Aggregate user check-ins from Local Storage across all classrooms
        const aggregatedUsers: UserRecord[] = [];
        rooms.forEach((room: { id: string; name: string }) => {
          const seatStatusData = seatStorage.get<Record<string, LiveSeatStatus>>(room.id);
          if (seatStatusData) {
            try {
              Object.entries(seatStatusData).forEach(([seatId, item]) => {
                if (item.status === 'ok' || item.status === 'ng') {
                  aggregatedUsers.push({
                    roomId: room.id,
                    roomName: room.name,
                    seatId,
                    name: item.name,
                    status: item.status,
                    comment: item.comment || undefined,
                  });
                }
              });
            } catch (err) {
              console.error(`Failed to parse seat statuses for room ${room.name}:`, err);
            }
          }
        });
        setUsersList(aggregatedUsers);
      } else {
        console.error('教室一覧の取得に失敗しました。');
      }
    } catch (err: any) {
      console.error(`データロードエラー: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Real-time subscription to all classrooms
  useEffect(() => {
    if (savedRooms.length === 0) return;

    const activeChannels: { sb: any; channel: any }[] = [];

    savedRooms.forEach((room: any) => {
      if (!room.supabaseUrl || !room.supabaseAnonKey) return;

      try {
        const sb = createClient(room.supabaseUrl, room.supabaseAnonKey);
        const channel = sb.channel(room.id, {
          config: { broadcast: { self: true } },
        });

        channel
          .on('broadcast', { event: 'student_to_teacher' }, (response) => {
            console.log(`[UserStudentPage] Received broadcast for room ${room.name}:`, response);
            const payload = response.payload;
            if (payload && payload.seatId && payload.status) {
              
              // 1. Update localStorage so it's persisted and synced
              const existingData = seatStorage.get<Record<string, LiveSeatStatus>>(room.id) || {};

              if (payload.status === 'none') {
                delete existingData[payload.seatId];
              } else {
                existingData[payload.seatId] = {
                  status: payload.status,
                  name: payload.studentName || '匿名',
                  comment: payload.comment || undefined,
                };
              }
              seatStorage.save(room.id, existingData);

              // 2. Update local state
              setUsersList((prev) => {
                // Remove existing record for this room & seat
                const filtered = prev.filter(u => !(u.roomId === room.id && u.seatId === payload.seatId));
                
                if (payload.status === 'none') {
                  return filtered;
                } else {
                  return [
                    ...filtered,
                    {
                      roomId: room.id,
                      roomName: room.name,
                      seatId: payload.seatId,
                      name: payload.studentName || '匿名',
                      status: payload.status,
                      comment: payload.comment || undefined,
                    }
                  ].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
                }
              });

              // Log real-time event to console instead of showing toast
              console.log(
                payload.status === 'none'
                  ? `[Realtime] 着席解除: ${payload.studentName || '匿名'} さんが ${room.name} (${payload.seatId}) を解放しました`
                  : `[Realtime] 着席受信: ${payload.studentName || '匿名'} さんが ${room.name} (${payload.seatId}) に着席しました`
              );
            }
          })
          .on('broadcast', { event: 'student_evicted' }, (response) => {
            const payload = response.payload;
            if (payload && payload.seatId) {
              const evictData = seatStorage.get<Record<string, LiveSeatStatus>>(room.id) || {};
              delete evictData[payload.seatId];
              seatStorage.save(room.id, evictData);

              setUsersList((prev) => prev.filter(u => !(u.roomId === room.id && u.seatId === payload.seatId)));
            }
          })
          .on('broadcast', { event: 'teacher_reset' }, () => {
            seatStorage.remove(room.id);
            setUsersList((prev) => prev.filter(u => u.roomId !== room.id));
            addToast('warning', `教室「${room.name}」の出席情報が一括クリアされました`);
          });

        channel.subscribe();
        activeChannels.push({ sb, channel });
      } catch (err) {
        console.error(`Failed to subscribe to real-time for room ${room.name}:`, err);
      }
    });

    return () => {
      activeChannels.forEach(({ sb, channel }) => {
        try {
          sb.removeChannel(channel);
        } catch (e) {}
      });
    };
  }, [savedRooms, addToast]);

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return usersList.filter((user) => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.comment && user.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
        user.seatId.includes(searchQuery);

      const matchesRoom = selectedRoomId === '' || user.roomId === selectedRoomId;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;

      return matchesSearch && matchesRoom && matchesStatus;
    });
  }, [usersList, searchQuery, selectedRoomId, selectedStatus]);

  // Remove check-in handler
  const handleRemoveCheckin = async (record: UserRecord) => {
    if (!window.confirm(`「${record.name}」さんの着席登録 (${record.seatId}) を解除しますか？`)) {
      return;
    }

    const stored = seatStorage.get<Record<string, LiveSeatStatus>>(record.roomId);
    if (stored) {
      try {
        const statuses = { ...stored } as Record<string, LiveSeatStatus>;
        delete statuses[record.seatId];
        seatStorage.save(record.roomId, statuses);
        addToast('success', '着席登録を解除しました。');
        loadAllData(); // Refresh list
      } catch (e) {
        addToast('error', '着席データの更新に失敗しました。');
        return;
      }
    }

    // Dynamic Supabase eviction broadcast
    const targetRoom = savedRooms.find(r => r.id === record.roomId) as any;
    if (targetRoom && targetRoom.supabaseUrl && targetRoom.supabaseAnonKey) {
      try {
        const sb = createClient(targetRoom.supabaseUrl, targetRoom.supabaseAnonKey);
        const channel = sb.channel(record.roomId);
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'student_evicted',
              payload: { seatId: record.seatId, timestamp: new Date().toISOString() },
            });
            sb.removeChannel(channel);
          }
        });
      } catch (err) {
        console.error('Failed to send dynamic eviction broadcast:', err);
      }
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      addToast('warning', 'エクスポートするデータがありません。');
      return;
    }

    const BOM = '\uFEFF';
    let csvContent = BOM + '学生名,教室名,座席位置,ステータス,コメント\n';
    
    filteredUsers.forEach((user) => {
      const statusText = user.status === 'ok' ? '着席 (OK)' : '要確認 (NG)';
      const row = [
        `"${user.name.replace(/"/g, '""')}"`,
        `"${user.roomName.replace(/"/g, '""')}"`,
        `"${user.seatId}"`,
        `"${statusText}"`,
        `"${(user.comment || '').replace(/"/g, '""')}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seats_check_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', '学生名簿 CSV をエクスポートしました！');
  };

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', minWidth: '1280px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(248, 250, 252, 0) 50%)' }}>
      {/* App Header */}
      <TeacherHeader activePage="students" subtitle="学生名簿" onLogout={handleLogout} />

      {/* Main Container */}
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Statistics Widgets */}
        <StudentStatsWidgets usersList={usersList} />

        <StudentListToolbar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          savedRooms={savedRooms}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          isLoading={isLoading}
          onRefresh={loadAllData}
          onExportCSV={handleExportCSV}
        />

        <StudentListTable 
          isLoading={isLoading}
          filteredUsers={filteredUsers}
          onRemoveCheckin={handleRemoveCheckin}
        />
      </main>
    </div>
  );
};
