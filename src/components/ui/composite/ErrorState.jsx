/**
 * ErrorState Component
 *
 * A standardized error display component for consistent error handling
 * across the application. Replaces various inline error displays.
 *
 * @example
 * <ErrorState
 *   error="Verbindung fehlgeschlagen"
 *   onRetry={handleRetry}
 * />
 */

import React from 'react';
import { AlertCircle, AlertTriangle, WifiOff, ServerCrash, RefreshCw, Home } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { useBranding } from '@/hooks/useBranding';

/**
 * Error type configurations
 */
const ERROR_TYPES = {
  default: {
    icon: AlertCircle,
    title: 'Ein Fehler ist aufgetreten',
    iconColor: COLORS.red[500],
    iconBg: COLORS.red[50],
  },
  network: {
    icon: WifiOff,
    title: 'Verbindungsfehler',
    iconColor: COLORS.amber[500],
    iconBg: COLORS.amber[50],
  },
  server: {
    icon: ServerCrash,
    title: 'Server-Fehler',
    iconColor: COLORS.red[500],
    iconBg: COLORS.red[50],
  },
  notFound: {
    icon: AlertTriangle,
    title: 'Nicht gefunden',
    iconColor: COLORS.slate[500],
    iconBg: COLORS.slate[100],
  },
  permission: {
    icon: AlertTriangle,
    title: 'Keine Berechtigung',
    iconColor: COLORS.amber[500],
    iconBg: COLORS.amber[50],
  },
};

/**
 * Size configurations
 */
const SIZES = {
  sm: {
    iconSize: 32,
    iconPadding: '12px',
    titleSize: '14px',
    messageSize: '12px',
    buttonSize: '12px',
    buttonPadding: '8px 16px',
    gap: '12px',
    padding: '24px',
  },
  md: {
    iconSize: 48,
    iconPadding: '16px',
    titleSize: '18px',
    messageSize: '14px',
    buttonSize: '14px',
    buttonPadding: '12px 24px',
    gap: '16px',
    padding: '40px 24px',
  },
  lg: {
    iconSize: 64,
    iconPadding: '20px',
    titleSize: '24px',
    messageSize: '16px',
    buttonSize: '16px',
    buttonPadding: '14px 28px',
    gap: '20px',
    padding: '60px 24px',
  },
};

/**
 * ErrorState Component
 *
 * @param {Object} props
 * @param {string|Error} props.error - Error message or Error object
 * @param {string} props.title - Custom title (overrides type default)
 * @param {string} props.type - Error type: 'default' | 'network' | 'server' | 'notFound' | 'permission'
 * @param {React.Component} props.icon - Custom icon component
 * @param {Function} props.onRetry - Callback for retry button
 * @param {string} props.retryText - Retry button text
 * @param {Function} props.onBack - Callback for back/home button
 * @param {string} props.backText - Back button text
 * @param {boolean} props.showDetails - Show error details (for debugging)
 * @param {string} props.size - Size: 'sm' | 'md' | 'lg'
 * @param {boolean} props.fullHeight - Use full viewport height
 * @param {React.ReactNode} props.children - Additional content
 */
const ErrorState = ({
  error,
  title: customTitle,
  type = 'default',
  icon: CustomIcon,
  onRetry,
  retryText = 'Erneut versuchen',
  onBack,
  backText = 'Zurück',
  showDetails = false,
  size = 'md',
  fullHeight = false,
  children,
  style = {},
}) => {
  const b = useBranding();

  // Get configurations
  const typeConfig = ERROR_TYPES[type] || ERROR_TYPES.default;
  const sizeConfig = SIZES[size] || SIZES.md;

  // Get error message string
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : null;

  // Determine icon
  const IconComponent = CustomIcon || typeConfig.icon;

  // Determine title
  const title = customTitle || typeConfig.title;

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: sizeConfig.padding,
        minHeight: fullHeight ? '60vh' : 'auto',
        gap: sizeConfig.gap,
        ...style,
      }}
    >
      {/* Icon */}
      <div
        className="w-fit rounded-2xl flex items-center justify-center"
        style={{
          padding: sizeConfig.iconPadding,
          backgroundColor: typeConfig.iconBg,
        }}
      >
        <IconComponent
          style={{
            width: sizeConfig.iconSize,
            height: sizeConfig.iconSize,
            color: typeConfig.iconColor,
          }}
        />
      </div>

      {/* Title */}
      <h3
        className="font-semibold text-slate-800 m-0"
        style={{ fontSize: sizeConfig.titleSize }}
      >
        {title}
      </h3>

      {/* Message */}
      {errorMessage && (
        <p
          className="text-slate-600 m-0 max-w-[400px] leading-relaxed"
          style={{ fontSize: sizeConfig.messageSize }}
        >
          {errorMessage}
        </p>
      )}

      {/* Details (for debugging) */}
      {showDetails && errorStack && (
        <details className="mt-2 max-w-full text-left">
          <summary className="text-xs text-slate-500 cursor-pointer">
            Technische Details
          </summary>
          <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-[11px] text-slate-700 overflow-auto max-h-[200px] whitespace-pre-wrap break-words">
            {errorStack}
          </pre>
        </details>
      )}

      {/* Custom children */}
      {children}

      {/* Actions */}
      {(onRetry || onBack) && (
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 font-semibold rounded-[10px] border border-slate-200 bg-white text-slate-700 cursor-pointer hover:bg-slate-50 transition-all"
              style={{
                padding: sizeConfig.buttonPadding,
                fontSize: sizeConfig.buttonSize,
              }}
            >
              <Home className="w-4 h-4" />
              {backText}
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 font-semibold rounded-[10px] border-none bg-primary text-white cursor-pointer hover:opacity-90 transition-all"
              style={{
                padding: sizeConfig.buttonPadding,
                fontSize: sizeConfig.buttonSize,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              {retryText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * NetworkError - Pre-configured for network errors
 */
export const NetworkError = ({
  onRetry,
  message = 'Bitte überprüfe deine Internetverbindung und versuche es erneut.',
  ...props
}) => (
  <ErrorState
    error={message}
    type="network"
    onRetry={onRetry}
    {...props}
  />
);

/**
 * ServerError - Pre-configured for server errors
 */
export const ServerError = ({
  onRetry,
  message = 'Der Server ist momentan nicht erreichbar. Bitte versuche es später erneut.',
  ...props
}) => (
  <ErrorState
    error={message}
    type="server"
    onRetry={onRetry}
    {...props}
  />
);

/**
 * NotFoundError - Pre-configured for 404 errors
 */
export const NotFoundError = ({
  onBack,
  message = 'Die angeforderte Seite oder Ressource wurde nicht gefunden.',
  ...props
}) => (
  <ErrorState
    error={message}
    type="notFound"
    onBack={onBack}
    {...props}
  />
);

/**
 * LoadingError - Pre-configured for failed loading states
 */
export const LoadingError = ({
  resource = 'Daten',
  onRetry,
  ...props
}) => (
  <ErrorState
    error={`${resource} konnten nicht geladen werden.`}
    title="Laden fehlgeschlagen"
    type="default"
    onRetry={onRetry}
    {...props}
  />
);

export default ErrorState;
