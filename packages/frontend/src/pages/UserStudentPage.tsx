import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sliders, MonitorPlay, Users, LogOut, Search, Filter, Download, Trash2, CheckCircle, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import client from '../lib/hc';
import { LiveSeatStatus } from '@my-app/shared';
import { createClient } from '@supabase/supabase-js';

interface UserStudentPageProps {
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface UserRecord {
  roomId: string;
  roomName: string;
  seatId: string;
  name: string;
  status: 'ok' | 'ng' | 'none';
  comment?: string;
}

export const UserStudentPage: React.FC<UserStudentPageProps> = ({ addToast }) => {
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (localStorage.getItem('teacher_auth') !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('teacher_auth');
    navigate('/');
  };

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
          const stored = localStorage.getItem(`seat_statuses_room_${room.id}`);
          if (stored) {
            try {
              const seatStatuses: Record<string, LiveSeatStatus> = JSON.parse(stored);
              Object.entries(seatStatuses).forEach(([seatId, item]) => {
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
        addToast('error', '教室一覧の取得に失敗しました。');
      }
    } catch (err: any) {
      addToast('error', `データロードエラー: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

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

    const stored = localStorage.getItem(`seat_statuses_room_${record.roomId}`);
    if (stored) {
      try {
        const statuses: Record<string, LiveSeatStatus> = JSON.parse(stored);
        delete statuses[record.seatId];
        localStorage.setItem(`seat_statuses_room_${record.roomId}`, JSON.stringify(statuses));
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
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* App Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🪑</div>
          <h1 className="header-title">Seats & Check <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>| 学生名簿</span></h1>
        </div>

        <div className="header-controls">
          <Link to="/room_layout" className="mode-toggle-btn">
            <Sliders size={16} /> レイアウトスタジオ
          </Link>
          <Link to="/seating" className="mode-toggle-btn">
            <MonitorPlay size={16} /> 教員用監視
          </Link>
          <Link to="/user/student" className="mode-toggle-btn active">
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

      {/* Main Container */}
      <main className="main-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Statistics Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>総チェックイン学生数</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981' }}>{usersList.length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>着席中 (OK)</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#10b981' }}>{usersList.filter(u => u.status === 'ok').length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>要確認 (NG)</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#ef4444' }}>{usersList.filter(u => u.status === 'ng').length} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>人</span></span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, alignItems: 'center' }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="text-input"
                placeholder="学生名、コメント、座席で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>

            {/* Room Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                className="text-input"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">すべての教室</option>
                {savedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <select
              className="text-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              style={{ padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="all">全ステータス</option>
              <option value="ok">着席 (OK) のみ</option>
              <option value="ng">要確認 (NG) のみ</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Refresh */}
            <button className="btn btn-secondary" onClick={loadAllData} style={{ padding: '0.5rem 0.75rem' }} title="再読み込み">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {/* CSV Export */}
            <button className="btn btn-primary" onClick={handleExportCSV} style={{ backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Download size={16} /> 名簿 CSV 出力
            </button>
          </div>
        </div>

        {/* Directory Datatable */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              読み込み中...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>登録された学生は見つかりませんでした</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>検索条件を変更するか、出席登録状況をご確認ください。</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>学生名</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>所属教室</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '120px' }}>座席番号</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '140px' }}>ステータス</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>コメント</th>
                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, width: '100px', textAlign: 'center' }}>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={`${user.roomId}_${user.seatId}`} 
                      style={{ 
                        borderBottom: index === filteredUsers.length - 1 ? 'none' : '1px solid var(--border-color)',
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{user.roomName}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{user.seatId}</code>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {user.status === 'ok' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <CheckCircle size={12} /> 着席 (OK)
                          </span>
                        ) : (
                          <span className="pulse-ng" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                            <AlertCircle size={12} /> 要確認 (NG)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontStyle: user.comment ? 'normal' : 'italic' }}>
                        {user.comment || 'コメントなし'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleRemoveCheckin(user)} 
                          className="btn" 
                          style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="チェックイン解除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
