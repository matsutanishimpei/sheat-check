import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Users, GraduationCap, XCircle, DoorOpen } from 'lucide-react';
import { GridItem, LiveSeatStatus } from '@my-app/shared';

interface SeatCellProps {
  x: number;
  y: number;
  cellType?: GridItem['type'];
  liveStatus?: LiveSeatStatus;
  onCycle: (x: number, y: number) => void;
}

export const SeatCell = React.memo(({ 
  x, 
  y, 
  cellType, 
  liveStatus,
  onCycle 
}: SeatCellProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y },
  });

  const getIcon = () => {
    switch (cellType) {
      case 'student': return <Users size={20} />;
      case 'teacher': return <GraduationCap size={20} />;
      case 'obstacle': return <XCircle size={18} />;
      case 'door': return <DoorOpen size={20} />;
      default: return null;
    }
  };

  const getCellClassName = () => {
    let classes = `grid-cell`;
    if (isOver) classes += ' cell-over';
    return classes;
  };

  return (
    <div
      ref={setNodeRef}
      onClick={() => onCycle(x, y)}
      className={getCellClassName()}
      title={cellType ? undefined : `座標: (${x}, ${y})`}
    >
      {cellType && (
        <div 
          className={`cell-item ${cellType} ${cellType === 'student' && liveStatus ? `student-live-${liveStatus.status}` : ''}`}
        >
          {cellType === 'student' && liveStatus ? (
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>
              {liveStatus.name.slice(0, 4)}
              <br />
              {liveStatus.status.toUpperCase()}
            </span>
          ) : (
            getIcon()
          )}
        </div>
      )}

      {/* Floating tooltip displayed on hover */}
      {cellType === 'student' && liveStatus && (
        <div className="cell-tooltip" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '160px' }}>
          <div className="tooltip-row">
            <span className="tooltip-name">{liveStatus.name}</span>
            <span className={`tooltip-status ${liveStatus.status}`}>
              {liveStatus.status === 'ok' ? '了解 (OK)' : '不調 (NG)'}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>学籍: {liveStatus.studentId || '-'}</span>
            {typeof liveStatus.responseTime === 'number' && (
              <span>応答: {(liveStatus.responseTime / 1000).toFixed(1)}秒</span>
            )}
          </div>

          {liveStatus.comment && (
            <div className="tooltip-comment" style={{ marginTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.25rem' }}>
              {liveStatus.comment}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SeatCell.displayName = 'SeatCell';
