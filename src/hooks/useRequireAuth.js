/**
 * useRequireAuth - Hook for requiring authentication
 *
 * Use this hook in components that require the user to be logged in.
 * If the user is not authenticated, it will trigger the login flow.
 *
 * Usage:
 *   import { useRequireAuth } from '@/hooks/useRequireAuth';
 *
 *   function MyComponent({ isAuthenticated, requireAuth }) {
 *     useRequireAuth(isAuthenticated, requireAuth);
 *     // ... rest of component
 *   }
 */

import { useEffect } from 'react';

/**
 * Triggers authentication flow if user is not logged in
 *
 * @param {boolean} isAuthenticated - Whether user is currently authenticated
 * @param {function} requireAuth - Function to trigger login modal/flow
 */
export function useRequireAuth(isAuthenticated, requireAuth) {
  useEffect(() => {
    if (!isAuthenticated && requireAuth) {
      requireAuth();
    }
  }, [isAuthenticated, requireAuth]);
}

export default useRequireAuth;
