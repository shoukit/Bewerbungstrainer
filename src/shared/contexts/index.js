/**
 * Combined Contexts Export
 *
 * This file provides a unified provider that combines all app contexts
 * and exports all context hooks for easy importing.
 */

import { UserProvider } from './UserContext';
import { AppConfigProvider } from './AppConfigContext';

/**
 * AppProviders - Combines all context providers in the correct order
 *
 * Order matters:
 * 1. AppConfigProvider (provides config for other providers)
 * 2. UserProvider (may depend on config)
 *
 * Usage:
 * ```jsx
 * import { AppProviders } from '@/shared/contexts';
 *
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
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

// Export individual hooks
export { useUser } from './UserContext';
export { useAppConfig } from './AppConfigContext';

// Export individual providers (in case needed separately)
export { UserProvider } from './UserContext';
export { AppConfigProvider } from './AppConfigContext';
