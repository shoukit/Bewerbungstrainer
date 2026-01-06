import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Clock,
  User,
  Info,
} from 'lucide-react';
import { COLORS } from '@/config/colors';
import DynamicFormField from '@/components/ui/composite/DynamicFormField';

/**
 * Render text with **bold** markdown syntax
 * @param {string} text - Text with **bold** markers
 * @returns {React.ReactNode[]} - Array of text and <strong> elements
 */
const renderBoldText = (text) => {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

/**
 * RoleplayVariablesPage Component
 *
 * Collects variable inputs for the roleplay scenario.
 * Replaces the popup dialog with a full page.
 */
const RoleplayVariablesPage = ({ scenario, onBack, onNext, primaryAccent, headerGradient, buttonGradient }) => {
  const [formValues, setFormValues] = useState({});
  const [interviewerValues, setInterviewerValues] = useState({});
  const [errors, setErrors] = useState({});

  // Get editable interviewer fields
  const editableInterviewerFields = React.useMemo(() => {
    const fields = [];
    const editable = scenario?.interviewer_profile?.editable_fields || {};
    const profile = scenario?.interviewer_profile || {};

    if (editable.name) {
      fields.push({ key: 'interviewer_name', label: 'Name des Gesprächspartners', value: profile.name || '' });
    }
    if (editable.role) {
      fields.push({ key: 'interviewer_role', label: 'Rolle/Position', value: profile.role || '' });
    }
    if (editable.image) {
      fields.push({ key: 'interviewer_image', label: 'Profilbild URL', value: profile.image_url || '', type: 'url' });
    }
    if (editable.properties) {
      fields.push({ key: 'interviewer_properties', label: 'Eigenschaften', value: profile.properties || '', type: 'textarea' });
    }
    if (editable.objections) {
      fields.push({ key: 'interviewer_objections', label: 'Typische Einwände', value: profile.typical_objections || '', type: 'textarea' });
    }
    if (editable.questions) {
      fields.push({ key: 'interviewer_questions', label: 'Wichtige Fragen', value: profile.important_questions || '', type: 'textarea' });
    }

    return fields;
  }, [scenario?.interviewer_profile]);

  // Initialize interviewer values with defaults
  useEffect(() => {
    if (editableInterviewerFields.length > 0) {
      const defaults = {};
      editableInterviewerFields.forEach(field => {
        defaults[field.key] = field.value;
      });
      setInterviewerValues(defaults);
    }
  }, [editableInterviewerFields]);

  // Get current interviewer profile values (merged with user edits)
  const getCurrentInterviewerProfile = () => {
    const profile = scenario?.interviewer_profile || {};
    return {
      name: interviewerValues.interviewer_name ?? profile.name,
      role: interviewerValues.interviewer_role ?? profile.role,
      image_url: interviewerValues.interviewer_image ?? profile.image_url,
      properties: interviewerValues.interviewer_properties ?? profile.properties,
      typical_objections: interviewerValues.interviewer_objections ?? profile.typical_objections,
      important_questions: interviewerValues.interviewer_questions ?? profile.important_questions,
    };
  };

  // Helper function to replace {{variable}} placeholders with values
  // Includes: form values, interviewer profile, and scenario fields
  const replaceVariables = (text) => {
    if (!text) return text;
    let result = text;

    // 1. Replace with form values (user inputs)
    Object.entries(formValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    });

    // 2. Replace interviewer profile fields (using current values which may be edited)
    const currentProfile = getCurrentInterviewerProfile();
    const profileMappings = {
      'interviewer_name': currentProfile.name,
      'interviewer_role': currentProfile.role,
      'interviewer_properties': currentProfile.properties,
      'interviewer_objections': currentProfile.typical_objections,
      'interviewer_questions': currentProfile.important_questions,
    };
    Object.entries(profileMappings).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value);
      }
    });

    return result;
  };

  // Parse variables schema - filter to only user input fields
  const userInputVariables = React.useMemo(() => {
    if (!scenario?.variables_schema) return [];
    return scenario.variables_schema.filter(varDef => varDef.user_input !== false);
  }, [scenario?.variables_schema]);

  // Initialize form with default values (all variables, not just user input)
  useEffect(() => {
    if (scenario?.variables_schema) {
      const defaults = {};
      scenario.variables_schema.forEach(varDef => {
        if (varDef.default) {
          defaults[varDef.key] = varDef.default;
        }
      });
      setFormValues(defaults);
    }
  }, [scenario?.variables_schema]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleInterviewerChange = (key, value) => {
    setInterviewerValues(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    userInputVariables.forEach(field => {
      const value = formValues[field.key];

      // Required validation
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.key] = `${field.label} ist ein Pflichtfeld`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Merge form values with interviewer values
    const allValues = {
      ...formValues,
      ...interviewerValues,
    };

    // Pass all variables (user-provided and auto-filled) to next step
    onNext(allValues);
  };

  // If no variables need user input AND no editable interviewer fields, auto-proceed to next step
  useEffect(() => {
    if (userInputVariables.length === 0 && editableInterviewerFields.length === 0) {
      // Still pass all default values
      const defaults = {};
      scenario?.variables_schema?.forEach(varDef => {
        if (varDef.default) {
          defaults[varDef.key] = varDef.default;
        }
      });
      onNext(defaults);
    }
  }, [userInputVariables, editableInterviewerFields, scenario, onNext]);

  // Don't render if no user input variables AND no editable interviewer fields needed (will auto-proceed)
  if (userInputVariables.length === 0 && editableInterviewerFields.length === 0) {
    return null;
  }

  return (
    <div className="p-6 pb-[200px] max-w-[640px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 mb-4 border-none bg-transparent text-slate-600 text-sm cursor-pointer rounded-md transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Zurück zur Übersicht
        </button>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ background: headerGradient }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 m-0">
              {scenario.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1 mb-0">
              Personalisiere dein Rollenspiel
            </p>
          </div>
        </div>
      </div>

      {/* Long Description - Detailed task description */}
      {scenario.long_description && (
        <div className="p-5 px-6 rounded-xl bg-white border border-slate-200 mb-6">
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: headerGradient }}
            >
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 m-0 mb-2">
                Deine Aufgabe
              </h3>
              <div className="text-sm leading-relaxed text-slate-700 m-0 whitespace-pre-wrap">
                {renderBoldText(replaceVariables(scenario.long_description?.replace(/\/n/g, '\n')))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Short Description - Only show if no long_description */}
      {!scenario.long_description && scenario.description && (
        <div className="p-4 px-5 rounded-lg bg-slate-100 mb-6">
          <p className="text-sm text-slate-700 m-0 leading-relaxed">
            {replaceVariables(scenario.description)}
          </p>
        </div>
      )}

      {/* Interviewer Profile Preview - only show if no editable fields (otherwise it's in the form) */}
      {scenario.interviewer_profile && editableInterviewerFields.length === 0 && (
        <div className="p-4 px-5 rounded-lg border border-slate-200 mb-6 flex items-center gap-4">
          {getCurrentInterviewerProfile().image_url ? (
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={getCurrentInterviewerProfile().image_url}
                alt={getCurrentInterviewerProfile().name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10"
            >
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 m-0">
              Dein Gesprächspartner: {getCurrentInterviewerProfile().name}
            </p>
            {getCurrentInterviewerProfile().role && (
              <p className="text-sm text-slate-600 mt-0.5 mb-0">
                {getCurrentInterviewerProfile().role}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {userInputVariables.map(field => (
          <DynamicFormField
            key={field.key}
            field={field}
            value={formValues[field.key]}
            onChange={handleChange}
            error={errors[field.key]}
            focusColor={primaryAccent}
          />
        ))}

        {/* Editable Interviewer Profile Fields */}
        {editableInterviewerFields.length > 0 && (
          <div className="mt-6 p-5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: headerGradient }}
              >
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 m-0">
                  KI-Gesprächspartner anpassen
                </h3>
                <p className="text-sm text-slate-600 m-0">
                  Passe die Eigenschaften deines Gesprächspartners an
                </p>
              </div>
            </div>

            {editableInterviewerFields.map(field => (
              <div key={field.key} className="mb-4 last:mb-0">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={interviewerValues[field.key] || ''}
                    onChange={(e) => handleInterviewerChange(field.key, e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                               transition-colors bg-white"
                    placeholder={field.value}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={interviewerValues[field.key] || ''}
                    onChange={(e) => handleInterviewerChange(field.key, e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                               transition-colors bg-white"
                    placeholder={field.value}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Session Info */}
        <div className="p-4 px-5 rounded-lg bg-primary/10 mt-6 mb-6 flex gap-5 flex-wrap">
          <div>
            <span className="text-xs text-slate-500 block">
              <Clock className="w-3 h-3 inline mr-1" />
              Dauer
            </span>
            <span className="text-base font-semibold text-slate-900">
              ca. 10 Min
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Typ</span>
            <span className="text-base font-semibold text-slate-900">
              Live-Gespräch
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-6 py-4 rounded-xl border-none text-white text-base font-semibold cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 shadow-primary"
        >
          Weiter
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default RoleplayVariablesPage;
