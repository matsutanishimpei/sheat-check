import React from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { GridItem } from '@my-app/shared';
import { StudentConfig } from '../components/student/StudentConfig';
import { StudentSelect } from '../components/student/StudentSelect';
import { StudentDashboard } from '../components/student/StudentDashboard';

interface StudentViewProps {
  supabase: SupabaseClient | null;
  studentStage: 'config' | 'select' | 'dashboard';
  setStudentStage: (stage: 'config' | 'select' | 'dashboard') => void;
  studentClassroomId: string;
  setStudentClassroomId: (id: string) => void;
  studentName: string;
  setStudentName: (name: string) => void;
  studentSeatId: string;
  setStudentSeatId: (seatId: string) => void;
  studentComment: string;
  setStudentComment: (comment: string) => void;
  studentRoomTitle: string;
  studentLiveSeatLocked: boolean;
  studentGridLayout: Record<string, GridItem['type']>;
  onStudentLogin: () => void;
  onLockSeat: () => void;
  onChangeSeat: () => void;
  onSendBroadcast: (status: 'ok' | 'ng') => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const StudentView: React.FC<StudentViewProps> = React.memo(({
  supabase,
  studentStage,
  setStudentStage,
  studentClassroomId,
  setStudentClassroomId,
  studentName,
  setStudentName,
  studentSeatId,
  setStudentSeatId,
  studentComment,
  setStudentComment,
  studentRoomTitle,
  studentLiveSeatLocked,
  studentGridLayout,
  onStudentLogin,
  onLockSeat,
  onChangeSeat,
  onSendBroadcast,
  addToast,
}) => {
  return (
    <main className="student-view-container">
      <div className="student-card">
        {studentStage === 'config' && (
          <StudentConfig
            supabase={supabase}
            studentClassroomId={studentClassroomId}
            setStudentClassroomId={setStudentClassroomId}
            studentName={studentName}
            setStudentName={setStudentName}
            onLogin={onStudentLogin}
          />
        )}

        {studentStage === 'select' && (
          <StudentSelect
            studentRoomTitle={studentRoomTitle}
            studentLiveSeatLocked={studentLiveSeatLocked}
            studentGridLayout={studentGridLayout}
            studentSeatId={studentSeatId}
            setStudentSeatId={setStudentSeatId}
            setStudentStage={setStudentStage}
            onLockSeat={onLockSeat}
            addToast={addToast}
          />
        )}

        {studentStage === 'dashboard' && (
          <StudentDashboard
            studentName={studentName}
            studentSeatId={studentSeatId}
            studentComment={studentComment}
            setStudentComment={setStudentComment}
            studentLiveSeatLocked={studentLiveSeatLocked}
            onSendBroadcast={onSendBroadcast}
            onChangeSeat={onChangeSeat}
          />
        )}
      </div>
    </main>
  );
});

StudentView.displayName = 'StudentView';
