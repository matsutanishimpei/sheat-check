import React from 'react';
import { SeatCell } from './SeatCell';
import { GridItem, LiveSeatStatus } from '@my-app/shared';

interface SeatMapProps {
  grid: Record<string, GridItem['type']>;
  liveStatuses: Record<string, LiveSeatStatus>;
  onCycle: (x: number, y: number) => void;
  massive?: boolean;
}

export const SeatMap = React.memo(({ grid, liveStatuses, onCycle, massive = false }: SeatMapProps) => {
  return (
    <div className={`grid-container-card ${massive ? 'grid-massive-container' : ''}`}>
      <div className={`grid-12x12 ${massive ? 'grid-massive' : ''}`}>
        {Array.from({ length: 12 }).map((_, y) => (
          Array.from({ length: 12 }).map((_, x) => {
            const coordKey = `${x},${y}`;
            const cellType = grid ? grid[coordKey] : undefined;
            const liveStatus = liveStatuses ? liveStatuses[coordKey] : undefined;
            return (
              <SeatCell
                key={coordKey}
                x={x}
                y={y}
                cellType={cellType}
                liveStatus={liveStatus}
                onCycle={onCycle}
              />
            );
          })
        ))}
      </div>
    </div>
  );
});

SeatMap.displayName = 'SeatMap';
