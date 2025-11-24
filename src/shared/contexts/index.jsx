import { UserProvider } from './UserContext';
import { AppConfigProvider } from './AppConfigContext';

/**
 * Combined provider for all app contexts
 * Wraps the entire application with necessary providers
 */
export function AppProviders({ children }) {
  return (
    <AppConfigProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AppConfigProvider>
  );
}

// Re-export hooks for convenience
export { useUser } from './UserContext';
export { useAppConfig } from './AppConfigContext';
