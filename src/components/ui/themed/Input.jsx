/**
 * Input Components - Partner-branded form inputs
 *
 * Features:
 * - Automatic partner branding via CSS variables
 * - Label and error message support
 * - Touch-friendly minimum size (44px height)
 * - iOS zoom prevention (16px font)
 * - Multiple input types (text, textarea, select)
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter name" />
 *
 * // With label and error
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Invalid email address"
 *   required
 * />
 *
 * // Textarea
 * <Textarea label="Description" rows={4} />
 */

import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// INPUT WRAPPER (handles label and error)
// =============================================================================

const InputWrapper = ({
  children,
  label,
  error,
  required,
  className,
  htmlFor,
}) => {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="input-label">
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="input-error-message flex items-center gap-1">
          <AlertCircle className="icon-sm" />
          {error}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// INPUT
// =============================================================================

const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  required,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <InputWrapper
      label={label}
      error={error}
      required={required}
      htmlFor={inputId}
    >
      <input
        ref={ref}
        id={inputId}
        type={type}
        required={required}
        className={cn(
          'input',
          error && 'input-error',
          className
        )}
        {...props}
      />
    </InputWrapper>
  );
});

Input.displayName = 'Input';

// =============================================================================
// TEXTAREA
// =============================================================================

const Textarea = React.forwardRef(({
  className,
  label,
  error,
  required,
  id,
  rows = 4,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <InputWrapper
      label={label}
      error={error}
      required={required}
      htmlFor={inputId}
    >
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        rows={rows}
        className={cn(
          'textarea',
          error && 'input-error',
          className
        )}
        {...props}
      />
    </InputWrapper>
  );
});

Textarea.displayName = 'Textarea';

// =============================================================================
// SELECT
// =============================================================================

const Select = React.forwardRef(({
  className,
  label,
  error,
  required,
  id,
  options = [],
  placeholder = 'Auswählen...',
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <InputWrapper
      label={label}
      error={error}
      required={required}
      htmlFor={inputId}
    >
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          required={required}
          className={cn(
            'input appearance-none pr-10',
            error && 'input-error',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            .slice() // Create a copy to avoid mutating the original
            .sort((a, b) => a.label.localeCompare(b.label, 'de'))
            .map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 icon-md pointer-events-none text-slate-400"
        />
      </div>
    </InputWrapper>
  );
});

Select.displayName = 'Select';

// =============================================================================
// CHECKBOX
// =============================================================================

const Checkbox = React.forwardRef(({
  className,
  label,
  error,
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn(
          'w-5 h-5 rounded-md border-2 cursor-pointer mt-0.5',
          'checked:bg-primary checked:border-primary',
          'focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
          error ? 'border-red-500' : 'border-slate-300'
        )}
        style={{
          accentColor: 'var(--primary-accent)',
        }}
        {...props}
      />
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm text-slate-600 cursor-pointer"
        >
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// =============================================================================
// FORM GROUP (for grouping related inputs)
// =============================================================================

const FormGroup = React.forwardRef(({
  children,
  className,
  columns = 1,
  ...props
}, ref) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div
      ref={ref}
      className={cn('grid gap-4', gridCols[columns], className)}
      {...props}
    >
      {children}
    </div>
  );
});

FormGroup.displayName = 'FormGroup';

export { Input, Textarea, Select, Checkbox, FormGroup, InputWrapper };
export default Input;
