import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { User, GraduationCap, XCircle, DoorOpen, X } from 'lucide-react';
import { GridItem, LiveSeatStatus } from '@my-app/shared';

interface SeatCellProps {
  x: number;
  y: number;
  cellType?: GridItem['type'];
  liveStatus?: LiveSeatStatus;
  onCycle: (x: number, y: number) => void;
  onRemoveLiveStatus?: (key: string) => void;
}

export const SeatCell = React.memo(({ 
  x, 
  y, 
  cellType, 
  liveStatus,
  onCycle,
  onRemoveLiveStatus
}: SeatCellProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y },
  });

  const getIcon = () => {
    switch (cellType) {
      case 'student': return <User size={20} />;
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

  const coordKey = `${x},${y}`;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onCycle(x, y)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={getCellClassName()}
      title={cellType ? undefined : `座標: (${x}, ${y})`}
      style={{ position: 'relative' }}
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

              {/* Individual Student Eviction (Kick) Button */}
              {onRemoveLiveStatus && isHovered && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`${liveStatus.name} さんをこの席から退室させますか？`)) {
                      onRemoveLiveStatus(coordKey);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    padding: 0,
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  title="この席を空席にする"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
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
