/**
 * SmartBriefingForm Component
 *
 * Handles variable input and briefing generation.
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import wordpressAPI from '../../services/wordpress-api';
import FullscreenLoader from '@/components/ui/composite/fullscreen-loader';
import DynamicFormField from '@/components/ui/composite/DynamicFormField';
import { getIcon } from '../../utils/iconMaps';
import { Button, Card } from '@/components/ui';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Custom Variable Item Component - Vertical Layout
 * Variable name on top, multiline textarea below
 */
const CustomVariableItem = ({ variable, index, onChange, onDelete }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
      {/* Header with variable name and delete button */}
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          value={variable.key || ''}
          onChange={(e) => onChange(index, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          placeholder="variable_name"
          className="flex-1 py-2 px-3 rounded-md border border-slate-200 text-sm font-mono bg-slate-50 mr-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="p-2 border-none bg-transparent cursor-pointer text-red-500 flex items-center justify-center hover:bg-red-50 rounded-md transition-colors"
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
        className="w-full py-2.5 px-3 rounded-md border border-slate-200 text-sm resize-y min-h-[80px] box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
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
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Custom variables state
  const [customVariables, setCustomVariables] = useState([]);
  const [showCustomVariables, setShowCustomVariables] = useState(false);

  const IconComponent = getIcon(template?.icon);

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
      <div className="p-6 pt-8 max-w-[700px] mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          disabled={isGenerating}
          className={`flex items-center gap-2 py-2 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer mb-6 transition-opacity ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:text-slate-700'}`}
        >
          <ArrowLeft size={18} />
          <span className="leading-relaxed">Zurück zur Übersicht</span>
        </button>

        {/* Template Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 mb-1">
                {template.title}
              </h1>
              <p className="text-sm text-slate-500">
                {template.description}
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6">
          {/* Variables Section Header */}
          <h2 className="text-base font-semibold text-slate-900 mb-5 pb-4 border-b border-slate-100">
            Deine Angaben
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Form Fields */}
            {template.variables_schema?.map((field) => (
              <DynamicFormField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={handleFieldChange}
                error={errors[field.key]}
              />
            ))}

            {/* Custom Variables Section - only shown if template allows */}
            {template.allow_custom_variables && (
              <div className="mt-6 mb-5 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomVariables(!showCustomVariables)}
                  className={`flex items-start gap-2 p-0 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer text-left ${showCustomVariables ? 'mb-4' : ''}`}
                >
                  <span className="flex items-center gap-2 flex-shrink-0">
                    {showCustomVariables ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    <Plus size={16} />
                  </span>
                  <span className="leading-relaxed">Zusätzliche Variablen hinzufügen (optional)</span>
                </button>

                {showCustomVariables && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[13px] text-slate-500 mb-3">
                      Füge eigene Variablen hinzu, die in die Briefing-Generierung einfließen sollen.
                    </p>

                    {customVariables.length > 0 && (
                      <div className="mb-3">
                        {customVariables.map((cv, index) => (
                          <CustomVariableItem
                            key={index}
                            variable={cv}
                            index={index}
                            onChange={updateCustomVariable}
                            onDelete={deleteCustomVariable}
                          />
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addCustomVariable}
                      className="flex items-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 rounded-lg bg-white text-slate-500 text-[13px] cursor-pointer w-full justify-center hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus size={14} />
                      Variable hinzufügen
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isGenerating}
              size="lg"
              fullWidth
              icon={<Sparkles size={20} />}
            >
              Briefing generieren
            </Button>
          </form>
        </Card>
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
