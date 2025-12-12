import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { getWPApiUrl, getWPNonce } from '@/services/wordpress-api';

/**
 * DemoWelcomeModal Component
 * Modal for demo user registration with code validation and contact info collection
 */
export function DemoWelcomeModal({ isOpen, onClose, onSuccess }) {
  const { branding, partnerName, logoUrl } = usePartner();

  const [demoCode, setDemoCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [homepage, setHomepage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get brand colors from partner branding
  const primaryAccent = branding?.['--primary-accent'] || '#3A7FA7';
  const buttonGradient = branding?.['--button-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%)';
  const focusRing = branding?.['--focus-ring'] || 'rgba(58, 127, 167, 0.3)';
  const headerText = branding?.['--header-text'] || '#ffffff';
  const sidebarTextColor = branding?.['--sidebar-text-color'] || '#ffffff';

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!demoCode.trim()) {
      setError('Bitte geben Sie Ihren Demo-Code ein.');
      return;
    }

    if (!companyName.trim()) {
      setError('Bitte geben Sie den Firmennamen ein.');
      return;
    }

    if (!contactName.trim()) {
      setError('Bitte geben Sie den Namen des Ansprechpartners ein.');
      return;
    }

    if (!contactEmail.trim()) {
      setError('Bitte geben Sie eine Kontakt-E-Mail ein.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    if (!privacyAccepted) {
      setError('Bitte stimmen Sie den Datenschutzbestimmungen zu.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = getWPApiUrl();
      const nonce = getWPNonce();

      // Validate and activate the demo code
      const response = await fetch(`${apiUrl}/demo/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          demo_code: demoCode.toUpperCase().trim(),
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          homepage: homepage.trim(),
          contact_email: contactEmail.trim(),
          phone: phone.trim(),
          privacy_accepted: privacyAccepted,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('[DEMO] Code activated successfully:', demoCode.toUpperCase());

        // Call success callback with the demo code
        if (onSuccess) {
          onSuccess(demoCode.toUpperCase().trim());
        }

        // Close modal
        if (onClose) {
          onClose();
        }
      } else {
        setError(result.error?.message || 'Der Demo-Code ist ungültig. Bitte überprüfen Sie Ihre Eingabe.');
      }
    } catch (err) {
      console.error('[DEMO] Activation error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close (cancel)
  const handleClose = () => {
    // Reset form
    setDemoCode('');
    setCompanyName('');
    setContactName('');
    setHomepage('');
    setContactEmail('');
    setPhone('');
    setPrivacyAccepted(false);
    setError('');

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
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
  };

  const inputFocusStyle = {
    borderColor: primaryAccent,
    boxShadow: `0 0 0 3px ${focusRing}`,
    backgroundColor: '#ffffff',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: headerGradient, color: headerText }}
        >
          <div className="flex items-center justify-between">
            <h2 id="demo-modal-title" className="text-xl font-semibold" style={{ color: headerText }}>
              Willkommen zur Demo!
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
            <div className="mt-3 mb-1 flex justify-center">
              <img
                src={logoUrl}
                alt={`${partnerName} Logo`}
                style={{
                  height: '5rem',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          <p className="text-sm mt-2" style={{ color: headerText, opacity: 0.9 }}>
            Wir freuen uns, dass Sie unsere Bewerbungstrainer-App testen möchten!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info text */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
            <p>
              Bitte geben Sie den Demo-Code ein, den Sie von uns erhalten haben,
              sowie Ihre Kontaktdaten für den Testzugang.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Demo Code field */}
          <div>
            <label htmlFor="demo-code" style={labelStyle}>
              Demo-Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="demo-code"
              value={demoCode}
              onChange={(e) => setDemoCode(e.target.value.toUpperCase())}
              style={{
                ...inputStyle,
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '2px',
                textAlign: 'center',
              }}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="XXXXX"
              maxLength={5}
              disabled={isLoading}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Company name and Contact name in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-name" style={labelStyle}>
                Firma <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Ihre Firma"
                disabled={isLoading}
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="contact-name" style={labelStyle}>
                Name Ansprechpartner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Ihr Name"
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Homepage */}
          <div>
            <label htmlFor="homepage" style={labelStyle}>
              Homepage
            </label>
            <input
              type="url"
              id="homepage"
              value={homepage}
              onChange={(e) => setHomepage(e.target.value)}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="https://www.ihre-firma.de"
              disabled={isLoading}
              autoComplete="url"
            />
          </div>

          {/* Email and Phone in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-email" style={labelStyle}>
                E-Mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="contact-email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="email@firma.de"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="phone" style={labelStyle}>
                Telefon
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="+49 123 456789"
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Privacy checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="privacy-accepted"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isLoading}
              style={{ accentColor: primaryAccent }}
            />
            <label htmlFor="privacy-accepted" className="text-sm text-gray-600">
              Ich stimme den{' '}
              <a
                href="/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900"
                style={{ color: primaryAccent }}
              >
                Datenschutzbestimmungen
              </a>{' '}
              für die Demo-Nutzung zu. <span className="text-red-500">*</span>
            </label>
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
              marginTop: '24px',
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
                <span style={{ color: sidebarTextColor }}>Wird überprüft...</span>
              </>
            ) : (
              <>
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={sidebarTextColor}
                  style={{ width: '20px', height: '20px' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: sidebarTextColor }}>Demo starten</span>
              </>
            )}
          </button>

          {/* Help text */}
          <p className="text-xs text-center text-gray-500 pt-2">
            Haben Sie keinen Demo-Code? Kontaktieren Sie uns unter{' '}
            <a href="mailto:info@karriereheld.de" className="underline" style={{ color: primaryAccent }}>
              info@karriereheld.de
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default DemoWelcomeModal;
