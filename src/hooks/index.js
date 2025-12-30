/**
 * Custom React Hooks - Central Export
 *
 * Import all hooks from this file for cleaner imports:
 * import { useMobile, useBranding, useAudioRecorder } from '@/hooks';
 */

// Responsive hooks
export { useMobile, useTablet, useMediaQuery, useBreakpoints } from './useMobile';

// Partner theming hooks
export { useBranding } from './useBranding';
export { default as usePartnerTheming } from './usePartnerTheming';

// Category management
export { useCategories } from './useCategories';

// Audio recording hook
export { useAudioRecorder, RECORDING_STATES } from './useAudioRecorder';

// Pending action hook (auth-gated actions)
export { usePendingAction, PENDING_ACTION_TYPES, createPendingAction } from './usePendingAction';

// Authentication hooks
export { useRequireAuth } from './useRequireAuth';

// Navigation/UI hooks
export { useScrollToTop } from './useScrollToTop';
