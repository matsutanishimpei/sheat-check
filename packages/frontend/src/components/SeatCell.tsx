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
        <div className="cell-tooltip">
          <div className="tooltip-row">
            <span className="tooltip-name">{liveStatus.name}</span>
            <span className={`tooltip-status ${liveStatus.status}`}>
              {liveStatus.status === 'ok' ? '了解 (OK)' : '不調 (NG)'}
            </span>
          </div>
          {liveStatus.comment && (
            <div className="tooltip-comment">
              {liveStatus.comment}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SeatCell.displayName = 'SeatCell';
