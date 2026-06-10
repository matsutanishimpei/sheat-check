import React from 'react';
import { SeatCell } from './SeatCell';
import { GridItem, LiveSeatStatus } from '@my-app/shared';

interface SeatMapProps {
  grid: Record<string, GridItem['type']>;
  liveStatuses: Record<string, LiveSeatStatus>;
  onCycle: (x: number, y: number) => void;
  onRemoveLiveStatus?: (key: string) => void;
  massive?: boolean;
}

export const SeatMap = React.memo(({ grid, liveStatuses, onCycle, onRemoveLiveStatus, massive = false }: SeatMapProps) => {
  return (
    <div className={`grid-container-card ${massive ? 'grid-massive-container' : ''}`} style={{ overflowX: 'auto', width: '100%' }}>
      <table 
        className={`seat-map-table ${massive ? 'massive' : ''}`} 
        style={{ 
          borderCollapse: 'separate', 
          borderSpacing: massive ? '12px' : '6px', 
          width: massive ? '100%' : 'auto', 
          margin: '0 auto' 
        }}
      >
        <tbody>
          {Array.from({ length: 12 }).map((_, y) => (
            <tr key={`row-${y}`}>
              {Array.from({ length: 12 }).map((_, x) => {
                const coordKey = `${x},${y}`;
                const cellType = grid ? grid[coordKey] : undefined;
                const liveStatus = liveStatuses ? liveStatuses[coordKey] : undefined;
                return (
                  <td key={coordKey} style={{ padding: 0, border: 'none' }}>
                    <SeatCell
                      x={x}
                      y={y}
                      cellType={cellType}
                      liveStatus={liveStatus}
                      onCycle={onCycle}
                      onRemoveLiveStatus={onRemoveLiveStatus}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

SeatMap.displayName = 'SeatMap';
