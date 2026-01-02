/**
 * useScrollToTop - Hook for scrolling to top on mount
 *
 * Use this hook in components/views that should scroll to top when mounted.
 * Common for page-level components and modals.
 *
 * Usage:
 *   import { useScrollToTop } from '@/hooks/useScrollToTop';
 *
 *   function MyPage() {
 *     useScrollToTop();
 *     // ... rest of component
 *   }
 *
 *   // With smooth scrolling:
 *   useScrollToTop({ behavior: 'smooth' });
 *
 *   // Conditional scroll (only when condition changes):
 *   useScrollToTop({ dependencies: [currentView] });
 */

import { useEffect } from 'react';

/**
 * Scrolls to top of page on mount or when dependencies change
 *
 * @param {object} options - Configuration options
 * @param {string} options.behavior - Scroll behavior: 'auto' | 'smooth' (default: 'auto')
 * @param {Array} options.dependencies - Additional dependencies to trigger scroll (default: [])
 */
export function useScrollToTop(options = {}) {
  const { behavior = 'auto', dependencies = [] } = options;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

export default useScrollToTop;
