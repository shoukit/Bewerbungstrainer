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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: sizeConfig.padding,
        minHeight: fullHeight ? '60vh' : 'auto',
        gap: sizeConfig.gap,
        ...style,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 'fit-content',
          padding: sizeConfig.iconPadding,
          borderRadius: '16px',
          backgroundColor: typeConfig.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
        style={{
          fontSize: sizeConfig.titleSize,
          fontWeight: 600,
          color: COLORS.slate[800],
          margin: 0,
        }}
      >
        {title}
      </h3>

      {/* Message */}
      {errorMessage && (
        <p
          style={{
            fontSize: sizeConfig.messageSize,
            color: COLORS.slate[600],
            margin: 0,
            maxWidth: '400px',
            lineHeight: 1.6,
          }}
        >
          {errorMessage}
        </p>
      )}

      {/* Details (for debugging) */}
      {showDetails && errorStack && (
        <details
          style={{
            marginTop: '8px',
            maxWidth: '100%',
            textAlign: 'left',
          }}
        >
          <summary
            style={{
              fontSize: '12px',
              color: COLORS.slate[500],
              cursor: 'pointer',
            }}
          >
            Technische Details
          </summary>
          <pre
            style={{
              marginTop: '8px',
              padding: '12px',
              backgroundColor: COLORS.slate[100],
              borderRadius: '8px',
              fontSize: '11px',
              color: COLORS.slate[700],
              overflow: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {errorStack}
          </pre>
        </details>
      )}

      {/* Custom children */}
      {children}

      {/* Actions */}
      {(onRetry || onBack) && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: sizeConfig.buttonPadding,
                fontSize: sizeConfig.buttonSize,
                fontWeight: 600,
                borderRadius: '10px',
                border: `1px solid ${COLORS.slate[200]}`,
                backgroundColor: 'white',
                color: COLORS.slate[700],
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Home style={{ width: '16px', height: '16px' }} />
              {backText}
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: sizeConfig.buttonPadding,
                fontSize: sizeConfig.buttonSize,
                fontWeight: 600,
                borderRadius: '10px',
                border: 'none',
                backgroundColor: b.primaryAccent,
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw style={{ width: '16px', height: '16px' }} />
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
