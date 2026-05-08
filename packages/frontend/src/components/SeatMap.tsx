import React from 'react';
import { SeatCell } from './SeatCell';
import { GridItem, LiveSeatStatus } from '@my-app/shared';

interface SeatMapProps {
  grid: Record<string, GridItem['type']>;
  liveStatuses: Record<string, LiveSeatStatus>;
  onCycle: (x: number, y: number) => void;
}

export const SeatMap = React.memo(({ grid, liveStatuses, onCycle }: SeatMapProps) => {
  return (
    <div className="grid-container-card">
      <div className="grid-9x9">
        {Array.from({ length: 9 }).map((_, y) => (
          Array.from({ length: 9 }).map((_, x) => {
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
