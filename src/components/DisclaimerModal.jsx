import React, { useState, useEffect } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { Info, AlertTriangle, Shield } from 'lucide-react';

/**
 * DisclaimerModal Component
 * Shows usage disclaimer to users after login
 * Users can acknowledge with or without "don't show again" option
 */
export function DisclaimerModal({ isOpen, onClose, onAcknowledge }) {
  const { branding, partnerName } = usePartner();

  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [disclaimer, setDisclaimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get brand colors from partner branding
  const primaryAccent = branding?.['--primary-accent'] || '#3A7FA7';
  const buttonGradient = branding?.['--button-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const headerText = branding?.['--header-text'] || '#ffffff';
  const sidebarTextColor = branding?.['--sidebar-text-color'] || '#ffffff';

  // Fetch disclaimer status when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDisclaimerStatus();
    }
  }, [isOpen]);

  const fetchDisclaimerStatus = async () => {
    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/disclaimer/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
        },
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (data.success && data.disclaimer) {
        setDisclaimer(data.disclaimer);
      }
    } catch (err) {
      console.error('[DISCLAIMER] Error fetching status:', err);
      setError('Fehler beim Laden des Hinweises');
    }
  };

  // Handle acknowledgment
  const handleAcknowledge = async () => {
    if (!disclaimer) return;

    setIsLoading(true);
    setError('');

    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/disclaimer/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          disclaimer_id: disclaimer.id,
          dont_show_again: dontShowAgain,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (onAcknowledge) {
          onAcknowledge(dontShowAgain);
        }
        if (onClose) {
          onClose();
        }
      } else {
        setError(data.message || 'Fehler bei der Bestätigung');
      }
    } catch (err) {
      console.error('[DISCLAIMER] Error acknowledging:', err);
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent backdrop click from closing - user must click the button
  const handleBackdropClick = (e) => {
    // Do nothing - disclaimer must be acknowledged via button
    e.stopPropagation();
  };

  // Prevent escape key from closing - user must click the button
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        // Do nothing - disclaimer must be acknowledged via button
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen || !disclaimer) {
    return null;
  }

  // Format content with line breaks
  const formatContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((paragraph, index) => (
      paragraph.trim() ? (
        <p key={index} className="mb-3 last:mb-0">
          {paragraph}
        </p>
      ) : null
    ));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: headerGradient, color: headerText }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Shield className="w-6 h-6" style={{ color: headerText }} />
            </div>
            <div>
              <h2 id="disclaimer-modal-title" className="text-xl font-semibold" style={{ color: headerText }}>
                {disclaimer.title}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: headerText, opacity: 0.8 }}>
                Version {disclaimer.version}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Disclaimer content */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-5">
            <div className="text-gray-700 text-sm leading-relaxed">
              {formatContent(disclaimer.content)}
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 mb-5">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Mit der Bestätigung akzeptieren Sie diese Nutzungshinweise für {partnerName}.
            </p>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-3 cursor-pointer group mb-6">
            <div className="relative">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded border-2 transition-all flex items-center justify-center"
                style={{
                  borderColor: dontShowAgain ? primaryAccent : '#cbd5e1',
                  backgroundColor: dontShowAgain ? primaryAccent : 'transparent',
                }}
              >
                {dontShowAgain && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              Diesen Hinweis nicht mehr anzeigen
            </span>
          </label>

          {/* Action button */}
          <button
            onClick={handleAcknowledge}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: 600,
              color: sidebarTextColor,
              background: isLoading ? '#94a3b8' : buttonGradient,
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: isLoading ? 'none' : '0 4px 14px rgba(58, 127, 167, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(58, 127, 167, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = isLoading ? 'none' : '0 4px 14px rgba(58, 127, 167, 0.3)';
            }}
          >
            {isLoading ? (
              <>
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  style={{
                    width: '20px',
                    height: '20px',
                    color: sidebarTextColor,
                    animation: 'spin 1s linear infinite',
                  }}
                >
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span style={{ color: sidebarTextColor, fontSize: '16px', fontWeight: 600 }}>Wird gespeichert...</span>
              </>
            ) : (
              <span style={{ color: sidebarTextColor, fontSize: '16px', fontWeight: 600 }}>
                Verstanden
              </span>
            )}
          </button>

          {/* Help text */}
          <p className="text-xs text-center text-gray-500 mt-4">
            {dontShowAgain
              ? 'Sie werden diesen Hinweis bei zukünftigen Anmeldungen nicht mehr sehen.'
              : 'Dieser Hinweis wird bei jeder Anmeldung angezeigt.'
            }
          </p>
        </div>
      </div>

      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

/**
 * useDisclaimerModal Hook
 * Convenience hook for managing disclaimer modal state and checking if it needs to be shown
 */
export function useDisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [needsDisclaimer, setNeedsDisclaimer] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkDisclaimerStatus = async () => {
    setIsChecking(true);
    try {
      const apiUrl = window.bewerbungstrainerConfig?.apiUrl || '/wp-json/bewerbungstrainer/v1';
      const response = await fetch(`${apiUrl}/disclaimer/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bewerbungstrainerConfig?.nonce || '',
        },
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (data.success) {
        const needsAck = data.needs_acknowledgment;
        setNeedsDisclaimer(needsAck);
        if (needsAck) {
          setIsOpen(true);
        }
        return needsAck;
      }
      return false;
    } catch (err) {
      console.error('[DISCLAIMER] Error checking status:', err);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const openDisclaimerModal = () => setIsOpen(true);
  const closeDisclaimerModal = () => {
    setIsOpen(false);
    setNeedsDisclaimer(false);
  };

  return {
    isOpen,
    needsDisclaimer,
    isChecking,
    openDisclaimerModal,
    closeDisclaimerModal,
    checkDisclaimerStatus,
  };
}

export default DisclaimerModal;
