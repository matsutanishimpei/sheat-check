import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherAuth } from '../lib/storage';

/**
 * Redirect to login page if the current user is not authenticated.
 *
 * Previously this exact useEffect was duplicated in:
 * - TeacherLayoutPage
 * - TeacherMonitorPage
 * - UserStudentPage
 * - UserTeacherPage
 */
export function useRequireAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!teacherAuth.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);
}

/**
 * Logout helper — clears auth tokens and navigates to login.
 *
 * Previously this exact logic was duplicated in 4 pages.
 */
export function useLogout() {
  const navigate = useNavigate();

  return () => {
    teacherAuth.clear();
    navigate('/');
  };
}
