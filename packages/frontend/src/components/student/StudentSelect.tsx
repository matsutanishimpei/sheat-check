import React from 'react';
import { Grid3X3, Lock, User, GraduationCap } from 'lucide-react';
import { GridItem } from '@my-app/shared';
import { useToast } from '../../contexts/ToastContext';

interface StudentSelectProps {
  studentRoomTitle: string;
  studentLiveSeatLocked: boolean;
  studentGridLayout: Record<string, GridItem['type']>;
  studentSeatId: string;
  setStudentSeatId: (val: string) => void;
  setStudentStage: (stage: 'config' | 'select' | 'dashboard') => void;
  onLockSeat: () => void;
}

export const StudentSelect: React.FC<StudentSelectProps> = React.memo(({
  studentRoomTitle,
  studentLiveSeatLocked,
  studentGridLayout,
  studentSeatId,
  setStudentSeatId,
  setStudentStage,
  onLockSeat,
}) => {
  const { addToast } = useToast();
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

      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', width: '100%' }}>
        <table 
          className="student-select-table" 
          style={{ 
            borderCollapse: 'separate', 
            borderSpacing: '6px', 
            width: '100%', 
            maxWidth: '420px', 
            tableLayout: 'fixed',
            margin: '0 auto'
          }}
        >
          <tbody>
            {Array.from({ length: 12 }).map((_, y) => (
              <tr key={`row-${y}`}>
                {Array.from({ length: 12 }).map((_, x) => {
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
                    <td 
                      key={coordKey} 
                      style={{ padding: 0, border: 'none', position: 'relative' }}
                    >
                      <div
                        onClick={handleClick}
                        className={cellClass}
                        style={{ aspectRatio: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isStudentSeat ? 'pointer' : 'default' }}
                      >
                        {isStudentSeat && (
                          <div 
                            className="cell-item student" 
                            style={isSelected ? { backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' } : undefined}
                          >
                            <User size={14} style={isSelected ? { color: '#0b132b', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.25))' } : undefined} />
                          </div>
                        )}
                        {cellType === 'teacher' && (
                          <div className="cell-item teacher">
                            <GraduationCap size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, justifyContent: 'center', whiteSpace: 'nowrap', fontSize: '0.95rem' }}
          onClick={() => setStudentStage('config')}
        >
          戻る
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2, justifyContent: 'center', whiteSpace: 'nowrap', fontSize: '0.95rem', gap: '0.5rem' }}
          onClick={onLockSeat}
          disabled={!studentSeatId}
        >
          <Lock size={16} /> この席で確定
        </button>
      </div>
    </div>
  );
});

StudentSelect.displayName = 'StudentSelect';
