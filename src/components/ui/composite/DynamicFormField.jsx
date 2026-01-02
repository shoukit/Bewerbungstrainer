import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useBranding } from '@/hooks/useBranding';
import { COLORS } from '@/config/colors';

/**
 * Scroll element into view for mobile keyboard
 * @param {Event} e - Focus event
 * @param {number} delay - Delay in ms before scrolling (default 300)
 */
const scrollIntoViewOnFocus = (e, delay = 300) => {
  setTimeout(() => {
    const element = e.target;
    if (element) {
      const fieldWrapper = element.closest('div');
      if (fieldWrapper) {
        fieldWrapper.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, delay);
};

/**
 * Get base input styles
 * @param {Object} branding - Branding object from useBranding hook
 * @param {boolean} hasError - Whether the field has an error
 * @returns {Object} - Style object
 */
const getBaseInputStyle = (branding, hasError = false) => ({
  width: '100%',
  padding: `${branding.space[3]} ${branding.space[4]}`,
  borderRadius: branding.radius.lg,
  border: `2px solid ${hasError ? COLORS.red[500] : COLORS.slate[200]}`,
  fontSize: branding.fontSize.base, // Minimum 16px to prevent iOS zoom
  color: COLORS.slate[900],
  backgroundColor: 'white',
  outline: 'none',
  transition: `border-color ${branding.transition.normal}, box-shadow ${branding.transition.normal}`,
});

/**
 * Get select dropdown arrow SVG as data URI
 */
const SELECT_ARROW_SVG = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;

/**
 * DynamicFormField Component
 *
 * Renders appropriate input based on field type from input_configuration.
 * Supports text, textarea, select, and number field types.
 *
 * @param {Object} props
 * @param {Object} props.field - Field configuration object
 * @param {string} props.field.key - Unique field identifier
 * @param {string} props.field.label - Display label
 * @param {string} props.field.type - Field type: 'text' | 'textarea' | 'select' | 'number'
 * @param {string} props.field.placeholder - Placeholder text
 * @param {string} props.field.hint - Helper text shown below field
 * @param {boolean} props.field.required - Whether field is required
 * @param {Array} props.field.options - Options for select type: [{value, label}] or [string]
 * @param {Object} props.field.validation - Validation rules (min, max for number)
 * @param {string} props.field.default - Default value
 * @param {string} props.value - Current field value
 * @param {Function} props.onChange - Callback: (key, value) => void
 * @param {string} props.error - Error message to display
 * @param {string} props.focusColor - Custom focus color (defaults to primary accent)
 */
const DynamicFormField = ({ field, value, onChange, error, focusColor }) => {
  const b = useBranding();
  const theFocusColor = focusColor || b.primaryAccent || COLORS.blue[500];

  const baseInputStyle = getBaseInputStyle(b, !!error);

  const focusStyle = {
    borderColor: theFocusColor,
    boxShadow: `0 0 0 3px ${theFocusColor}1a`,
  };

  const handleFocus = (e) => {
    Object.assign(e.target.style, focusStyle);
    scrollIntoViewOnFocus(e);
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = error ? COLORS.red[500] : COLORS.slate[200];
    e.target.style.boxShadow = 'none';
  };

  const getPlaceholder = () => {
    return field.placeholder || field.default || `${field.label} eingeben...`;
  };

  // Determine autoComplete value based on field key/label to prevent Chrome showing wrong suggestions
  const getAutoComplete = () => {
    const key = field.key?.toLowerCase() || '';
    const label = field.label?.toLowerCase() || '';

    if (key.includes('name') || label.includes('name')) return 'name';
    if (key.includes('email') || label.includes('email')) return 'email';
    if (key.includes('company') || label.includes('unternehmen') || label.includes('firma')) return 'organization';
    if (key.includes('position') || label.includes('position') || label.includes('stelle')) return 'organization-title';

    // Default: disable autofill for unknown fields to prevent credit card suggestions
    return 'off';
  };

  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={getPlaceholder()}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete={getAutoComplete()}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={getPlaceholder()}
            rows={4}
            style={{
              ...baseInputStyle,
              resize: 'vertical',
              minHeight: '100px',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete={getAutoComplete()}
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
              backgroundImage: SELECT_ARROW_SVG,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '20px',
              paddingRight: '44px',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">Bitte wählen...</option>
            {field.options
              ?.slice() // Create a copy to avoid mutating the original
              .sort((a, b) => {
                // Support both {value, label} objects and plain strings
                const labelA = a.label ?? a;
                const labelB = b.label ?? b;
                return String(labelA).localeCompare(String(labelB), 'de');
              })
              .map((option) => {
              // Support both {value, label} objects and plain strings
              const optionValue = option.value ?? option;
              const optionLabel = option.label ?? option;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={getPlaceholder()}
            min={field.validation?.min}
            max={field.validation?.max}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete="off"
          />
        );

      default:
        // Default to text input
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={getPlaceholder()}
            style={baseInputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoComplete={getAutoComplete()}
          />
        );
    }
  };

  return (
    <div className="mb-5">
      <label className="block mb-2 text-sm font-semibold text-slate-700">
        {field.label}
        {field.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      {renderInput()}

      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {field.hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          {field.hint}
        </p>
      )}
    </div>
  );
};

export default DynamicFormField;

// Also export utility functions for reuse
export { scrollIntoViewOnFocus, getBaseInputStyle };
