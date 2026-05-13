import React from 'react';
import { Grid3X3, Lock, Users, GraduationCap } from 'lucide-react';
import { GridItem } from '@my-app/shared';

interface StudentSelectProps {
  studentRoomTitle: string;
  studentLiveSeatLocked: boolean;
  studentGridLayout: Record<string, GridItem['type']>;
  studentSeatId: string;
  setStudentSeatId: (val: string) => void;
  setStudentStage: (stage: 'config' | 'select' | 'dashboard') => void;
  onLockSeat: () => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const StudentSelect: React.FC<StudentSelectProps> = React.memo(({
  studentRoomTitle,
  studentLiveSeatLocked,
  studentGridLayout,
  studentSeatId,
  setStudentSeatId,
  setStudentStage,
  onLockSeat,
  addToast,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="student-title-group">
        <h2 className="student-title" style={{ color: 'var(--color-student)' }}>
          <Grid3X3 size={24} /> 固定座席の選択
        </h2>
        <p className="student-subtitle">「{studentRoomTitle}」の座席図から自分の着席席をタップしてください</p>
      </div>

      {studentLiveSeatLocked && (
        <div className="lock-banner">
          <Lock size={16} />
          <span>教員によって座席選択がロックされています（席の変更不可）</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <div className="grid-12x12" style={{ maxWidth: '420px' }}>
          {Array.from({ length: 12 }).map((_, y) => (
            Array.from({ length: 12 }).map((_, x) => {
              const coordKey = `${x},${y}`;
              const cellType = studentGridLayout[coordKey];
              const isStudentSeat = cellType === 'student';
              const isSelected = studentSeatId === coordKey;
              
              let cellClass = 'grid-cell student-unselectable';
              if (isStudentSeat) {
                cellClass = isSelected 
                  ? 'grid-cell student-selected' 
                  : 'grid-cell student-selectable';
              }

              const handleClick = () => {
                if (isStudentSeat && !studentLiveSeatLocked) {
                  setStudentSeatId(coordKey);
                } else if (studentLiveSeatLocked) {
                  addToast('error', '座席ロック中のため席の変更はできません');
                }
              };

              return (
                <div
                  key={coordKey}
                  onClick={handleClick}
                  className={cellClass}
                  style={{ aspectRatio: 1, position: 'relative' }}
                >
                  {isStudentSeat && (
                    <div 
                      className="cell-item student" 
                      style={isSelected ? { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' } : undefined}
                    >
                      <Users size={14} style={isSelected ? { color: '#0b132b', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.25))' } : undefined} />
                    </div>
                  )}
                  {cellType === 'teacher' && (
                    <div className="cell-item teacher">
                      <GraduationCap size={14} />
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          onClick={() => setStudentStage('config')}
        >
          戻る
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2, justifyContent: 'center' }}
          onClick={onLockSeat}
          disabled={!studentSeatId}
        >
          <Lock size={16} /> この席で確定・ロック
        </button>
      </div>
    </div>
  );
});

StudentSelect.displayName = 'StudentSelect';
