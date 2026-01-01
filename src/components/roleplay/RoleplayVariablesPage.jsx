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
 * RoleplayVariablesPage Component
 *
 * Collects variable inputs for the roleplay scenario.
 * Replaces the popup dialog with a full page.
 */
const RoleplayVariablesPage = ({ scenario, onBack, onNext, primaryAccent, headerGradient, buttonGradient }) => {
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});

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

    // 2. Replace interviewer profile fields
    if (scenario?.interviewer_profile) {
      const profileMappings = {
        'interviewer_name': scenario.interviewer_profile.name,
        'interviewer_role': scenario.interviewer_profile.role,
        'interviewer_properties': scenario.interviewer_profile.properties,
        'interviewer_objections': scenario.interviewer_profile.typical_objections,
        'interviewer_questions': scenario.interviewer_profile.important_questions,
      };
      Object.entries(profileMappings).forEach(([key, value]) => {
        if (value) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          result = result.replace(regex, value);
        }
      });
    }

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

    // Pass all variables (user-provided and auto-filled) to next step
    onNext(formValues);
  };

  // If no variables need user input, auto-proceed to next step
  useEffect(() => {
    if (userInputVariables.length === 0) {
      // Still pass all default values
      const defaults = {};
      scenario?.variables_schema?.forEach(varDef => {
        if (varDef.default) {
          defaults[varDef.key] = varDef.default;
        }
      });
      onNext(defaults);
    }
  }, [userInputVariables, scenario, onNext]);

  // Don't render if no user input variables needed (will auto-proceed)
  if (userInputVariables.length === 0) {
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
              <p className="text-sm leading-relaxed text-slate-700 m-0 whitespace-pre-wrap">
                {replaceVariables(scenario.long_description?.replace(/\/n/g, '\n'))}
              </p>
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

      {/* Interviewer Profile Preview */}
      {scenario.interviewer_profile && (
        <div className="p-4 px-5 rounded-lg border border-slate-200 mb-6 flex items-center gap-4">
          {scenario.interviewer_profile.image_url ? (
            <img
              src={scenario.interviewer_profile.image_url}
              alt={replaceVariables(scenario.interviewer_profile.name)}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10"
            >
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900 m-0">
              Dein Gesprächspartner: {replaceVariables(scenario.interviewer_profile.name)}
            </p>
            {scenario.interviewer_profile.role && (
              <p className="text-sm text-slate-600 mt-0.5 mb-0">
                {replaceVariables(scenario.interviewer_profile.role)}
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
