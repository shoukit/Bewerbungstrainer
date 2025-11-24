import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/shared/contexts';
import AppRoutes from '@/routes/AppRoutes';
import Header from '@/components/Header';
import './index.css';

/**
 * Root Application Component
 * Provides routing and global context providers
 *
 * Architecture:
 * - BrowserRouter: Client-side routing
 * - AppProviders: Global state (User, Config)
 * - Header: Global navigation
 * - AppRoutes: Route definitions
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <AppRoutes />
          </main>
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}
