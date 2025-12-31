import React, { useState } from 'react';
import { usePartner } from '@/context/PartnerContext';
import { getWPApiUrl, getWPNonce } from '@/services/wordpress-api';
import { COLORS, GRADIENTS, hexToRgba } from '@/config/colors';

/**
 * DemoWelcomeModal Component
 * 2-Step modal for demo user registration:
 * Step 1: Demo code validation
 * Step 2: Contact details (only for new codes, skipped for already activated codes)
 */
export function DemoWelcomeModal({ isOpen, onClose, onSuccess }) {
  const { branding, partnerName, logoUrl } = usePartner();

  // Step management: 1 = code entry, 2 = contact details
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [demoCode, setDemoCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [homepage, setHomepage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // State
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get brand colors from partner branding
  const primaryAccent = branding?.['--primary-accent'] || '#6366f1';
  const buttonGradient = branding?.['--button-gradient'] || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  const headerGradient = branding?.['--header-gradient'] || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  const focusRing = branding?.['--focus-ring'] || 'rgba(99, 102, 241, 0.3)';
  const headerText = branding?.['--header-text'] || '#ffffff';
  const sidebarTextColor = branding?.['--sidebar-text-color'] || '#ffffff';

  // Step 1: Validate demo code
  const handleValidateCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!demoCode.trim()) {
      setError('Bitte geben Sie Ihren Demo-Code ein.');
      return;
    }

    if (demoCode.trim().length !== 5) {
      setError('Der Demo-Code muss 5 Zeichen lang sein.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = getWPApiUrl();
      const nonce = getWPNonce();

      // Validate the demo code
      const response = await fetch(`${apiUrl}/demo/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          demo_code: demoCode.toUpperCase().trim(),
        }),
      });

      const result = await response.json();

      if (!result.valid) {
        setError('Der Demo-Code ist ungültig. Bitte überprüfen Sie Ihre Eingabe.');
        return;
      }

      // Code is valid - check if already activated
      if (result.is_activated) {
        // Code already has contact details - skip step 2 and complete
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess(demoCode.toUpperCase().trim());
        }
      } else {
        // Code is new - go to step 2 for contact details
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('[DEMO] Validation error:', err);
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit contact details and activate code
  const handleSubmitContactDetails = async (e) => {
    e.preventDefault();
    setError('');

    // Validate required fields
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

      // Activate the demo code with contact details
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
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess(demoCode.toUpperCase().trim());
        }
      } else {
        setError(result.error?.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
    // Don't trigger cancel if we just successfully completed
    if (isSuccess) {
      return;
    }

    // Reset form
    setCurrentStep(1);
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

  // Handle back button (step 2 → step 1)
  const handleBack = () => {
    setCurrentStep(1);
    setError('');
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
  }, [isOpen, isSuccess]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{ background: headerGradient, color: headerText }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep === 2 && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    color: headerText,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  aria-label="Zurück"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 id="demo-modal-title" className="text-xl font-semibold" style={{ color: headerText }}>
                {currentStep === 1 ? 'Demo-Code eingeben' : 'Kontaktdaten'}
              </h2>
            </div>
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

          {/* Logo (if configured) - only on step 1 */}
          {logoUrl && currentStep === 1 && (
            <div className="mt-3 mb-1 flex justify-center">
              <img
                src={logoUrl}
                alt={`${partnerName} Logo`}
                style={{
                  height: '4rem',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <div
              className="w-8 h-1 rounded-full transition-colors"
              style={{ backgroundColor: headerText, opacity: currentStep >= 1 ? 1 : 0.3 }}
            />
            <div
              className="w-8 h-1 rounded-full transition-colors"
              style={{ backgroundColor: headerText, opacity: currentStep >= 2 ? 1 : 0.3 }}
            />
          </div>
        </div>

        {/* Step 1: Demo Code Entry */}
        {currentStep === 1 && (
          <form onSubmit={handleValidateCode} className="p-6 space-y-4">
            {/* Info text */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
              <p>
                Willkommen zur Demo! Bitte geben Sie den Demo-Code ein, den Sie von uns erhalten haben.
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
              <label htmlFor="demo-code" className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Demo-Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="demo-code"
                value={demoCode}
                onChange={(e) => setDemoCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-4 text-2xl font-semibold font-mono tracking-[4px] text-center border border-slate-200 rounded-xl outline-none transition-all bg-white focus:border-primary focus:ring-3 focus:ring-primary/30"
                placeholder="XXXXX"
                maxLength={5}
                disabled={isLoading}
                autoComplete="off"
                autoFocus
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
                marginTop: '16px',
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span style={{ color: sidebarTextColor }}>Weiter</span>
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
        )}

        {/* Step 2: Contact Details */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmitContactDetails} className="p-6 space-y-4">
            {/* Info text */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <p>
                <strong>Code gültig!</strong> Bitte geben Sie noch Ihre Kontaktdaten ein, um die Demo zu starten.
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

            {/* Company name */}
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
                autoFocus
              />
            </div>

            {/* Contact name */}
            <div>
              <label htmlFor="contact-name" style={labelStyle}>
                Ansprechpartner <span className="text-red-500">*</span>
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

            {/* Email */}
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

            {/* Homepage */}
            <div>
              <label htmlFor="homepage" style={labelStyle}>
                Homepage <span className="text-gray-400">(optional)</span>
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

            {/* Phone */}
            <div>
              <label htmlFor="phone" style={labelStyle}>
                Telefon <span className="text-gray-400">(optional)</span>
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
                zu. <span className="text-red-500">*</span>
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
                marginTop: '16px',
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
                  <span style={{ color: sidebarTextColor }}>Wird aktiviert...</span>
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
          </form>
        )}
      </div>
    </div>
  );
}

export default DemoWelcomeModal;
