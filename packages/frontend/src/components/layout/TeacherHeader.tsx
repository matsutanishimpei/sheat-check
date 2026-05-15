import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Sliders, MonitorPlay, UserCheck, ShieldAlert, LayoutGrid } from 'lucide-react';

type ActivePage = 'layout' | 'monitor' | 'students' | 'teachers';

interface TeacherHeaderProps {
  activePage: ActivePage;
  subtitle: string;
  onLogout: () => void;
}

/**
 * Shared header navigation for all Teacher pages.
 *
 * Previously this exact JSX block (~20 lines) was copy-pasted in:
 * - TeacherLayoutPage
 * - TeacherMonitorPage
 * - UserStudentPage
 * - UserTeacherPage
 */
export const TeacherHeader: React.FC<TeacherHeaderProps> = ({ activePage, subtitle, onLogout }) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-icon">
          <LayoutGrid size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h1 className="header-title">
          Seats & Check{' '}
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 'normal' }}>
            | {subtitle}
          </span>
        </h1>
      </div>

      <div className="header-controls">
        <Link to="/room_layout" className={`mode-toggle-btn layout-btn${activePage === 'layout' ? ' active' : ''}`}>
          <Sliders size={16} /> 教室設定
        </Link>
        <Link to="/seats/monitoring" className={`mode-toggle-btn monitor-btn${activePage === 'monitor' ? ' active' : ''}`}>
          <MonitorPlay size={16} /> みんなの様子
        </Link>
        <Link to="/student/monitoring" className={`mode-toggle-btn students-btn${activePage === 'students' ? ' active' : ''}`}>
          <UserCheck size={16} /> 学生名簿
        </Link>
        <Link to="/user/teacher" className={`mode-toggle-btn teachers-btn${activePage === 'teachers' ? ' active' : ''}`}>
          <ShieldAlert size={16} /> 教員一覧
        </Link>
        <button onClick={onLogout} className="mode-toggle-btn" style={{ marginLeft: '1rem', color: 'var(--color-obstacle)' }}>
          <LogOut size={16} /> ログアウト
        </button>
      </div>
    </header>
  );
};
