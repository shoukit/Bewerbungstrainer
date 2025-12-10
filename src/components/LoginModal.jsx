import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';

/**
 * LoginModal Component
 * Modal dialog for user authentication via WordPress REST API
 */
export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login, branding, partnerName, logoUrl } = usePartner();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get brand colors from partner branding
  const primaryAccent = branding?.['--primary-accent'] || '#3A7FA7';
  const buttonGradient = branding?.['--button-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const focusRing = branding?.['--focus-ring'] || 'rgba(58, 127, 167, 0.3)';
  const headerText = branding?.['--header-text'] || '#ffffff';

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Bitte geben Sie Benutzername und Passwort ein.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        // Clear form
        setUsername('');
        setPassword('');

        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }

        // Close modal
        if (onClose) {
          onClose();
        }
      } else {
        setError(result.error || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setError('');
    setUsername('');
    setPassword('');
    if (onClose) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Input field styles
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
  };

  const inputFocusStyle = {
    borderColor: primaryAccent,
    boxShadow: `0 0 0 3px ${focusRing}`,
    backgroundColor: '#ffffff',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: headerGradient, color: headerText }}
        >
          <div className="flex items-center justify-between">
            <h2 id="login-modal-title" className="text-xl font-semibold" style={{ color: headerText }}>
              Anmelden
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl transition-colors"
              style={{
                color: headerText,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              aria-label="Schließen"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Logo (if configured) */}
          {logoUrl && (
            <div className="mt-4 mb-2 flex justify-center">
              <img
                src={logoUrl}
                alt={`${partnerName} Logo`}
                style={{
                  height: '8.5rem',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          <p className="text-sm mt-1" style={{ color: headerText, opacity: 0.8 }}>
            Bei {partnerName} anmelden
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Username field */}
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-2">
              Benutzername oder E-Mail
            </label>
            <input
              type="text"
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#ffffff';
              }}
              placeholder="Ihr Benutzername"
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
                e.target.style.backgroundColor = '#ffffff';
              }}
              placeholder="Ihr Passwort"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
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
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span style={{ color: '#ffffff' }}>Wird angemeldet...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#ffffff' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span style={{ color: '#ffffff' }}>Anmelden</span>
              </>
            )}
          </button>

          {/* Help text */}
          <p className="text-xs text-center text-gray-500 pt-2">
            Verwenden Sie Ihre WordPress-Zugangsdaten zur Anmeldung.
          </p>
        </form>
      </div>
    </div>
  );
}

/**
 * useLoginModal Hook
 * Convenience hook for managing login modal state
 */
export function useLoginModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = () => setIsOpen(true);
  const closeLoginModal = () => setIsOpen(false);

  return {
    isOpen,
    openLoginModal,
    closeLoginModal,
  };
}

export default LoginModal;
