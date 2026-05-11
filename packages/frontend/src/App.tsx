import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastList } from './components/ToastList';
import { LoginPage } from './pages/LoginPage';
import { TeacherLayoutPage } from './pages/TeacherLayoutPage';
import { TeacherMonitorPage } from './pages/TeacherMonitorPage';
import { StudentPage } from './pages/StudentPage';
import { UserStudentPage } from './pages/UserStudentPage';
import { UserTeacherPage } from './pages/UserTeacherPage';
import './index.css';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage addToast={addToast} />} />
        <Route path="/room_layout" element={<TeacherLayoutPage addToast={addToast} />} />
        <Route path="/seating" element={<TeacherMonitorPage addToast={addToast} />} />
        <Route path="/user" element={<Navigate to="/user/student" replace />} />
        <Route path="/user/student" element={<UserStudentPage addToast={addToast} />} />
        <Route path="/user/teacher" element={<UserTeacherPage addToast={addToast} />} />
        <Route path="/teacher" element={<Navigate to="/" replace />} />
        <Route path="/student/:roomId" element={<StudentPage addToast={addToast} />} />
        <Route path="/student" element={<StudentPage addToast={addToast} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastList toasts={toasts} />
    </BrowserRouter>
  );
};

export default App;
