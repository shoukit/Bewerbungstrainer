import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes.config';

// Pages
import HomePage from '@/pages/HomePage';
import InterviewPage from '@/pages/InterviewPage';
import ProfilePage from '@/pages/ProfilePage';
import HistoryPage from '@/pages/HistoryPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Shared Components
import UserWizard from '@/components/UserWizard';

/**
 * Main application routing
 * All routes are defined here for centralized management
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Core Pages */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.WIZARD} element={<UserWizard />} />

      {/* Interview Module (temporary placeholder) */}
      <Route path={ROUTES.INTERVIEW} element={<InterviewPage />} />

      {/* User Pages */}
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.HISTORY} element={<HistoryPage />} />

      {/* Redirect /modules to home for now */}
      <Route path={ROUTES.MODULES} element={<Navigate to={ROUTES.HOME} replace />} />

      {/* 404 Not Found */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}
