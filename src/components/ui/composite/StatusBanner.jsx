import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, Loader2, X } from 'lucide-react';
import { COLORS } from '@/config/colors';

/**
 * Status Banner Variants Configuration
 */
const VARIANTS = {
  error: {
    bg: COLORS.red[50],
    border: COLORS.red[200],
    text: COLORS.red[600],
    icon: AlertCircle,
  },
  warning: {
    bg: COLORS.amber[50],
    border: COLORS.amber[200],
    text: COLORS.amber[600],
    icon: AlertTriangle,
  },
  success: {
    bg: COLORS.green[50],
    border: COLORS.green[200],
    text: COLORS.green[600],
    icon: CheckCircle,
  },
  info: {
    bg: COLORS.blue[50],
    border: COLORS.blue[200],
    text: COLORS.blue[500],
    icon: Info,
  },
  loading: {
    bg: COLORS.blue[50],
    border: COLORS.blue[200],
    text: COLORS.blue[500],
    icon: Loader2,
  },
};

/**
 * StatusBanner Component
 *
 * A reusable banner for displaying status messages (error, warning, success, info, loading).
 * Can be used inline or as a fixed toast notification.
 *
 * @param {Object} props
 * @param {'error' | 'warning' | 'success' | 'info' | 'loading'} props.variant - Banner type
 * @param {string} props.message - Message to display
 * @param {React.ReactNode} props.children - Alternative to message prop for complex content
 * @param {boolean} props.isToast - If true, positions as fixed toast at bottom center
 * @param {Function} props.onDismiss - Optional callback to dismiss the banner (shows X button)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const StatusBanner = ({
  variant = 'info',
  message,
  children,
  isToast = false,
  onDismiss,
  className = '',
  style = {},
}) => {
  const config = VARIANTS[variant] || VARIANTS.info;
  const IconComponent = config.icon;
  const isLoading = variant === 'loading';

  return (
    <div
      className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium ${isToast ? 'fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg z-[1000] max-w-[90%]' : ''} ${className}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        ...style,
      }}
    >
      <IconComponent
        size={20}
        className={`flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`}
      />
      <span className="flex-1">{children || message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: config.text }}
          aria-label="Schließen"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/**
 * ErrorBanner - Convenience wrapper for error status
 */
export const ErrorBanner = (props) => <StatusBanner variant="error" {...props} />;

/**
 * WarningBanner - Convenience wrapper for warning status
 */
export const WarningBanner = (props) => <StatusBanner variant="warning" {...props} />;

/**
 * SuccessBanner - Convenience wrapper for success status
 */
export const SuccessBanner = (props) => <StatusBanner variant="success" {...props} />;

/**
 * InfoBanner - Convenience wrapper for info status
 */
export const InfoBanner = (props) => <StatusBanner variant="info" {...props} />;

/**
 * LoadingBanner - Convenience wrapper for loading status
 */
export const LoadingBanner = (props) => <StatusBanner variant="loading" {...props} />;

/**
 * ErrorToast - Fixed position error toast at bottom of screen
 */
export const ErrorToast = ({ message, onDismiss, ...props }) => (
  <StatusBanner variant="error" message={message} isToast onDismiss={onDismiss} {...props} />
);

/**
 * SuccessToast - Fixed position success toast at bottom of screen
 */
export const SuccessToast = ({ message, onDismiss, ...props }) => (
  <StatusBanner variant="success" message={message} isToast onDismiss={onDismiss} {...props} />
);

export default StatusBanner;
