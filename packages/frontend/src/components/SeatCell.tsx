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
            <>
              {/* Default Name Display */}
              <span className="student-name-display" style={{ 
                fontSize: '0.85rem', 
                fontWeight: 850, 
                textAlign: 'center', 
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                width: '100%',
                padding: '0 6px',
                boxSizing: 'border-box'
              }}>
                {liveStatus.name}
              </span>
              {/* Hover Student ID Display */}
              <span className="student-id-display" style={{ 
                fontSize: '0.8rem', 
                fontWeight: 'bold', 
                fontFamily: 'monospace',
                textAlign: 'center', 
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'none', /* Toggled via CSS on hover */
                width: '100%',
                padding: '0 4px',
                boxSizing: 'border-box',
                letterSpacing: '0.02em'
              }}>
                {liveStatus.studentId}
              </span>
            </>
          ) : (
            getIcon()
          )}
        </div>
      )}
    </div>
  );
});

SeatCell.displayName = 'SeatCell';
