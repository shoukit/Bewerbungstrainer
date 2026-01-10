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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';


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

  // Additional info state (simple freetext field)
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

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
    // Reset additional info when template changes
    setAdditionalInfo('');
    setShowAdditionalInfo(false);
  }, [template]);

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
      const requestBody = {
        template_id: template.id,
        variables: formData,
      };

      // Include additional_info if provided
      if (additionalInfo.trim()) {
        requestBody.additional_info = additionalInfo.trim();
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

            {/* Additional Info Section - only shown if template allows */}
            {template.allow_custom_variables && (
              <div className="mt-6 mb-5 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                  className="flex items-center gap-2 p-0 border-none bg-transparent text-slate-500 text-sm font-medium cursor-pointer text-left"
                >
                  {showAdditionalInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span className="leading-relaxed">Zusätzliche Informationen (optional)</span>
                </button>

                {showAdditionalInfo && (
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <p className="text-[13px] text-slate-500 mb-3">
                      Ergänze hier alles, was dein Briefing noch relevanter machen könnte.
                    </p>
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="z.B. besondere Erfahrungen, spezifische Herausforderungen, wichtige Hintergrundinformationen..."
                      rows={4}
                      className="w-full py-3 px-3.5 rounded-lg border border-slate-200 bg-white text-sm resize-y min-h-[100px] box-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-400"
                    />
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
