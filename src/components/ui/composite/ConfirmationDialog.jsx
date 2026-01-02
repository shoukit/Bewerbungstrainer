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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-[420px] w-full p-6 relative animate-[dialogFadeIn_0.2s_ease-out]">
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-2 bg-transparent border-none rounded-lg cursor-pointer text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon */}
        {IconComponent && (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: iconBg }}
          >
            <IconComponent style={{ width: '28px', height: '28px', color: iconColor }} />
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 text-center m-0 mb-2">
          {title}
        </h3>

        {/* Message */}
        <div className="text-sm text-slate-600 text-center leading-relaxed mb-6">
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* Cancel Button - uses indigo theme */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 px-5 py-3 text-sm font-semibold rounded-xl border-2 border-indigo-500 bg-white text-indigo-600 transition-all hover:bg-indigo-50 ${
              isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-5 py-3 text-sm font-semibold rounded-xl border-none transition-all flex items-center justify-center gap-2 ${
              isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:opacity-90'
            }`}
            style={{
              backgroundColor: confirmBg,
              color: variantConfig.confirmText,
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
