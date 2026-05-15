import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { ToastList } from './components/ToastList';
import { LoginPage } from './pages/LoginPage';
import { TeacherLayoutPage } from './pages/TeacherLayoutPage';
import { TeacherMonitorPage } from './pages/TeacherMonitorPage';
import { StudentPage } from './pages/StudentPage';
import { UserStudentPage } from './pages/UserStudentPage';
import { UserTeacherPage } from './pages/UserTeacherPage';
import './index.css';

// Re-export Toast type for any external consumers that might need it
export type { Toast } from './contexts/ToastContext';

/** Inner component that consumes ToastContext for the ToastList overlay */
const AppRoutes = () => {
  const { toasts } = useToast();

  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/room_layout" element={<TeacherLayoutPage />} />
        <Route path="/seats/monitoring" element={<TeacherMonitorPage />} />
        <Route path="/user" element={<Navigate to="/student/monitoring" replace />} />
        <Route path="/student/monitoring" element={<UserStudentPage />} />
        <Route path="/user/teacher" element={<UserTeacherPage />} />
        <Route path="/teacher" element={<Navigate to="/" replace />} />
        <Route path="/student/:roomId" element={<StudentPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastList toasts={toasts} />
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
