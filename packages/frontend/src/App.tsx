import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastList } from './components/ToastList';
import { TeacherPage } from './pages/TeacherPage';
import { StudentPage } from './pages/StudentPage';
import './index.css';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
};

// Component to handle backward compatibility for old ?room=UUID QR codes
const QueryParamRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim()) {
      navigate(`/student/${roomParam.trim()}`, { replace: true });
    }
  }, [navigate]);
  
  return null;
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
      <QueryParamRedirect />
      <Routes>
        <Route path="/" element={<TeacherPage addToast={addToast} />} />
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
