import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import { DEFAULT_BRANDING } from '../../config/partners';
import wordpressAPI from '../../services/wordpress-api';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileText,
  Briefcase,
  Banknote,
  Users,
  User,
  MessageCircle,
  Target,
  Award,
  Book,
  ClipboardList,
  Star,
  Lightbulb,
  Shield,
  Compass,
  Rocket,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Icon mapping for template icons
 */
const ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
  'user': User,
  'message-circle': MessageCircle,
  'target': Target,
  'award': Award,
  'book': Book,
  'clipboard': ClipboardList,
  'star': Star,
  'lightbulb': Lightbulb,
  'shield': Shield,
  'compass': Compass,
  'rocket': Rocket,
};

/**
 * Dynamic Form Field Component
 */
const FormField = ({ field, value, onChange, error, primaryAccent }) => {
  const baseInputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '16px',
    color: '#0f172a',
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = primaryAccent;
    e.target.style.boxShadow = `0 0 0 3px ${primaryAccent}1a`;
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0';
    e.target.style.boxShadow = 'none';
  };

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
            style={{
              ...baseInputStyle,
              minHeight: '120px',
              resize: 'vertical',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );

      case 'select':
        return (
          <select
            value={value || field.default || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{
              ...baseInputStyle,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px',
              paddingRight: '44px',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">Bitte wahlen...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || ''}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '8px',
        }}
      >
        {field.label}
        {field.required && (
          <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
        )}
      </label>
      {renderInput()}
      {error && (
        <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Custom Variable Item Component - Vertical Layout
 * Variable name on top, multiline textarea below
 */
const CustomVariableItem = ({ variable, index, onChange, onDelete, primaryAccent }) => {
  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '12px',
      }}
    >
      {/* Header with variable name and delete button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <input
          type="text"
          value={variable.key || ''}
          onChange={(e) => onChange(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          placeholder="variable_name"
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            fontFamily: 'monospace',
            backgroundColor: '#f8fafc',
            flex: 1,
            marginRight: '8px',
          }}
        />
        <button
          type="button"
          onClick={() => onDelete(index)}
          style={{
            padding: '8px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Multiline textarea for value */}
      <textarea
        value={variable.value || ''}
        onChange={(e) => onChange(index, 'value', e.target.value)}
        placeholder="Wert eingeben... (mehrzeilig möglich)"
        rows={3}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          resize: 'vertical',
          minHeight: '80px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

/**
 * SmartBriefingForm Component
 *
 * Handles variable input and briefing generation
 */
const SmartBriefingForm = ({
  template,
  onBack,
  onBriefingGenerated,
  isAuthenticated,
}) => {
  const { branding } = usePartner();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Custom variables state
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

  // Variables section collapsed state (collapsed by default)
  const [isVariablesExpanded, setIsVariablesExpanded] = useState(false);

  // Get themed styles from partner branding
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
  const buttonGradient = branding?.['--button-gradient'] || DEFAULT_BRANDING['--button-gradient'];
  const IconComponent = ICON_MAP[template?.icon] || FileText;

  // Initialize form data from template defaults
  useEffect(() => {
    if (template?.variables_schema) {
      const initialData = {};
      template.variables_schema.forEach((field) => {
        if (field.default) {
          initialData[field.key] = field.default;
        }
      });
      setFormData(initialData);
    }
    // Reset custom variables when template changes
    setCustomVariables([]);
    setShowCustomVariables(false);
  }, [template]);

  // Custom variables handlers
  const addCustomVariable = () => {
    setCustomVariables([...customVariables, { key: '', value: '' }]);
  };

  const updateCustomVariable = (index, field, value) => {
    const updated = [...customVariables];
    updated[index][field] = value;
    setCustomVariables(updated);
  };

  const deleteCustomVariable = (index) => {
    setCustomVariables(customVariables.filter((_, i) => i !== index));
  };

  // Handle field change
  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    template?.variables_schema?.forEach((field) => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = 'Dieses Feld ist erforderlich';
      }
    });
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsGenerating(true);
    setApiError(null);

    try {
      // Build custom variables object from array
      const customVarsObj = {};
      customVariables.forEach((cv) => {
        if (cv.key && cv.value) {
          customVarsObj[cv.key] = cv.value;
        }
      });

      const requestBody = {
        template_id: template.id,
        variables: formData,
      };

      // Include custom_variables if there are any
      if (Object.keys(customVarsObj).length > 0) {
        requestBody.custom_variables = customVarsObj;
      }

      const response = await wordpressAPI.request('/smartbriefing/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (response.success && response.data?.briefing) {
        onBriefingGenerated(response.data.briefing);
      } else {
        throw new Error('Unerwartete API-Antwort');
      }
    } catch (err) {
      console.error('[SmartBriefing] Error generating briefing:', err);
      setApiError(err.message || 'Fehler beim Generieren des Briefings');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!template) {
    return null;
  }

  return (
    <>
      <div
        style={{
          padding: '24px',
          paddingTop: '32px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isGenerating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          border: 'none',
          background: 'none',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          marginBottom: '24px',
          opacity: isGenerating ? 0.5 : 1,
        }}
      >
        <ArrowLeft size={18} />
        Zuruck zur Ubersicht
      </button>

      {/* Template Header */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={28} style={{ color: primaryAccent }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 4px 0',
              }}
            >
              {template.title}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
              }}
            >
              {template.description}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Collapsible Variables Section Header */}
        <button
          type="button"
          onClick={() => setIsVariablesExpanded(!isVariablesExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 16px 0',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: isVariablesExpanded ? '20px' : '0',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Deine Angaben
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            <span>{isVariablesExpanded ? 'Einklappen' : 'Ausklappen'}</span>
            {isVariablesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        <form onSubmit={handleSubmit}>
          {/* Collapsible Variables Content */}
          {isVariablesExpanded && (
            <>
              {template.variables_schema?.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onChange={handleFieldChange}
                  error={errors[field.key]}
                  primaryAccent={primaryAccent}
                />
              ))}

              {/* Custom Variables Section - only shown if template allows */}
              {template.allow_custom_variables && (
                <div
                  style={{
                    marginTop: '24px',
                    marginBottom: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCustomVariables(!showCustomVariables)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0',
                      border: 'none',
                      background: 'none',
                      color: '#64748b',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      marginBottom: showCustomVariables ? '16px' : '0',
                    }}
                  >
                    {showCustomVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <Plus size={16} />
                    Zusätzliche Variablen hinzufügen (optional)
                  </button>

                  {showCustomVariables && (
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#64748b',
                          margin: '0 0 12px 0',
                        }}
                      >
                        Füge eigene Variablen hinzu, die in die Briefing-Generierung einfließen sollen.
                      </p>

                      {customVariables.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          {customVariables.map((cv, index) => (
                            <CustomVariableItem
                              key={index}
                              variable={cv}
                              index={index}
                              onChange={updateCustomVariable}
                              onDelete={deleteCustomVariable}
                              primaryAccent={primaryAccent}
                            />
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={addCustomVariable}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          color: '#64748b',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        Variable hinzufügen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* API Error */}
          {apiError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>{apiError}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              background: buttonGradient,
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: `0 4px 14px ${primaryAccent}40`,
              opacity: isGenerating ? 0.7 : 1,
              marginTop: isVariablesExpanded ? '0' : '20px',
            }}
          >
            <Sparkles size={20} />
            Briefing generieren
          </button>
        </form>
      </div>

      </div>

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isGenerating}
        message="Smart Briefing wird erstellt..."
        subMessage="Die KI analysiert deine Angaben und erstellt ein maßgeschneidertes Briefing."
      />
    </>
  );
};

export default SmartBriefingForm;
