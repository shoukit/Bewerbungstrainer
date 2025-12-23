/**
 * ConfirmationDialog Component
 *
 * A reusable confirmation dialog with customizable styling.
 * Replaces multiple inline dialog implementations across the codebase.
 *
 * @example
 * <ConfirmationDialog
 *   isOpen={showDialog}
 *   title="Session beenden?"
 *   message="Möchtest du die Session wirklich beenden?"
 *   confirmText="Ja, beenden"
 *   cancelText="Abbrechen"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   variant="danger"
 * />
 */

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { COLORS } from '@/config/colors';
import { useBranding } from '@/hooks/useBranding';

/**
 * Variant configurations for different dialog types
 */
const VARIANTS = {
  danger: {
    icon: AlertCircle,
    iconBg: COLORS.red[50],
    iconColor: COLORS.red[500],
    confirmBg: COLORS.red[500],
    confirmHover: COLORS.red[600],
    confirmText: 'white',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: COLORS.amber[50],
    iconColor: COLORS.amber[500],
    confirmBg: COLORS.amber[500],
    confirmHover: COLORS.amber[600],
    confirmText: 'white',
  },
  success: {
    icon: CheckCircle,
    iconBg: COLORS.green[50],
    iconColor: COLORS.green[500],
    confirmBg: COLORS.green[500],
    confirmHover: COLORS.green[600],
    confirmText: 'white',
  },
  info: {
    icon: Info,
    iconBg: COLORS.blue[50],
    iconColor: COLORS.blue[500],
    confirmBg: COLORS.blue[500],
    confirmHover: COLORS.blue[600],
    confirmText: 'white',
  },
  primary: {
    icon: null, // Uses custom icon or none
    iconBg: null,
    iconColor: null,
    confirmBg: null, // Uses branding primary accent
    confirmHover: null,
    confirmText: 'white',
  },
};

/**
 * ConfirmationDialog Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {string} props.title - Dialog title
 * @param {string|React.ReactNode} props.message - Dialog message
 * @param {React.Component} props.icon - Custom icon component (optional)
 * @param {string} props.confirmText - Confirm button text (default: "Bestätigen")
 * @param {string} props.cancelText - Cancel button text (default: "Abbrechen")
 * @param {string} props.variant - Dialog variant: 'danger' | 'warning' | 'success' | 'info' | 'primary'
 * @param {Function} props.onConfirm - Called when confirm is clicked
 * @param {Function} props.onCancel - Called when cancel is clicked or backdrop is clicked
 * @param {boolean} props.showCloseButton - Show X button in corner (default: false)
 * @param {boolean} props.isLoading - Show loading state on confirm button
 * @param {string} props.loadingText - Text to show when loading
 */
const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  icon: CustomIcon,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'danger',
  onConfirm,
  onCancel,
  showCloseButton = false,
  isLoading = false,
  loadingText = 'Wird verarbeitet...',
}) => {
  const b = useBranding();

  if (!isOpen) return null;

  const variantConfig = VARIANTS[variant] || VARIANTS.danger;
  const IconComponent = CustomIcon || variantConfig.icon;

  // Get colors from variant or branding
  const confirmBg = variantConfig.confirmBg || b.primaryAccent;
  const confirmHover = variantConfig.confirmHover || b.primaryAccent;
  const iconBg = variantConfig.iconBg;
  const iconColor = variantConfig.iconColor || b.primaryAccent;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onCancel) {
      onCancel();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          position: 'relative',
          animation: 'dialogFadeIn 0.2s ease-out',
        }}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: COLORS.slate[400],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        )}

        {/* Icon */}
        {IconComponent && (
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <IconComponent style={{ width: '28px', height: '28px', color: iconColor }} />
          </div>
        )}

        {/* Title */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: COLORS.slate[900],
            textAlign: 'center',
            margin: '0 0 8px 0',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <div
          style={{
            fontSize: '14px',
            color: COLORS.slate[600],
            textAlign: 'center',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {message}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '10px',
              border: `1px solid ${COLORS.slate[200]}`,
              backgroundColor: 'white',
              color: COLORS.slate[700],
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '10px',
              border: 'none',
              backgroundColor: confirmBg,
              color: variantConfig.confirmText,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>

        {/* Animation keyframes */}
        <style>{`
          @keyframes dialogFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

/**
 * DeleteConfirmationDialog - Pre-configured for delete actions
 */
export const DeleteConfirmationDialog = ({
  isOpen,
  title = 'Löschen bestätigen',
  message = 'Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
  confirmText = 'Ja, löschen',
  cancelText = 'Abbrechen',
  onConfirm,
  onCancel,
  isLoading,
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    title={title}
    message={message}
    confirmText={confirmText}
    cancelText={cancelText}
    variant="danger"
    onConfirm={onConfirm}
    onCancel={onCancel}
    isLoading={isLoading}
    loadingText="Wird gelöscht..."
  />
);

/**
 * ExitConfirmationDialog - Pre-configured for exit/cancel actions
 */
export const ExitConfirmationDialog = ({
  isOpen,
  title = 'Session beenden?',
  message = 'Dein Fortschritt geht verloren. Möchtest du wirklich abbrechen?',
  confirmText = 'Ja, beenden',
  cancelText = 'Weitermachen',
  onConfirm,
  onCancel,
}) => (
  <ConfirmationDialog
    isOpen={isOpen}
    title={title}
    message={message}
    confirmText={confirmText}
    cancelText={cancelText}
    variant="warning"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export default ConfirmationDialog;
