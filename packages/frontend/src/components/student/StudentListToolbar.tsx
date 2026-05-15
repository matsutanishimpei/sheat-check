import React from 'react';
import { Search, Filter, RefreshCw, Download } from 'lucide-react';

interface StudentListToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedRoomId: string;
  setSelectedRoomId: (val: string) => void;
  savedRooms: { id: string; name: string }[];
  selectedStatus: string;
  setSelectedStatus: React.Dispatch<React.SetStateAction<'all' | 'ok' | 'ng'>> | ((val: any) => void);
  isLoading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
}

export const StudentListToolbar: React.FC<StudentListToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedRoomId,
  setSelectedRoomId,
  savedRooms,
  selectedStatus,
  setSelectedStatus,
  isLoading,
  onRefresh,
  onExportCSV
}) => {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, alignItems: 'center' }}>
        
        {/* Search Box */}
        <div style={{ position: 'relative', minWidth: '250px', flex: 1 }}>
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
        <button className="btn btn-secondary" onClick={onRefresh} style={{ padding: '0.5rem 0.75rem' }} title="再読み込み">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button className="btn btn-primary" onClick={onExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Download size={16} /> 名簿 CSV 出力
        </button>
      </div>
    </div>
  );
};
