import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

/**
 * Dialog to collect variable values from the user before starting roleplay
 */
const RoleplayVariablesDialog = ({ open, scenario, onSubmit, onCancel }) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize values with defaults when scenario changes
  useEffect(() => {
    if (scenario?.variables_schema) {
      const initialValues = {};

      // Initialize ALL variables (both user_input=true and user_input=false)
      scenario.variables_schema.forEach((varDef) => {
        initialValues[varDef.key] = varDef.default || '';
      });

      setValues(initialValues);
      setErrors({});
    }
  }, [scenario]);

  const handleChange = (key, value) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    // Filter to only show variables that require user input
    const userInputVariables = scenario.variables_schema.filter((varDef) => {
      // If user_input is undefined (backward compatibility), default to true
      return varDef.user_input !== false;
    });

    // Validate required fields (only for user input variables)
    const newErrors = {};
    userInputVariables.forEach((varDef) => {
      if (varDef.required && !values[varDef.key]?.trim()) {
        newErrors[varDef.key] = `${varDef.label} ist ein Pflichtfeld`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('✅ [RoleplayVariablesDialog] Variables:', values);

    // Submit ALL values (both user-provided and auto-filled)
    onSubmit(values);
  };

  // Filter to only show variables that require user input
  const userInputVariables = scenario?.variables_schema?.filter((varDef) => {
    // If user_input is undefined (backward compatibility), default to true
    return varDef.user_input !== false;
  }) || [];

  if (!scenario?.variables_schema || scenario.variables_schema.length === 0) {
    // No variables to collect, submit immediately
    if (open) {
      onSubmit({});
    }
    return null;
  }

  // If no variables require user input, submit immediately with auto-filled values
  if (userInputVariables.length === 0) {
    if (open) {
      onSubmit(values);
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {scenario.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Bitte fülle die folgenden Informationen aus, um das Rollenspiel zu starten.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {userInputVariables.map((varDef) => (
            <div key={varDef.key} className="space-y-2">
              <Label htmlFor={varDef.key} className="text-sm font-semibold">
                {varDef.label}
                {varDef.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {varDef.type === 'textarea' ? (
                <Textarea
                  id={varDef.key}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  className={errors[varDef.key] ? 'border-red-500' : ''}
                  rows={3}
                />
              ) : (
                <Input
                  id={varDef.key}
                  type={varDef.type === 'number' ? 'number' : 'text'}
                  value={values[varDef.key] || ''}
                  onChange={(e) => handleChange(varDef.key, e.target.value)}
                  placeholder={varDef.default || `${varDef.label} eingeben...`}
                  className={errors[varDef.key] ? 'border-red-500' : ''}
                />
              )}

              {errors[varDef.key] && (
                <p className="text-sm text-red-500">{errors[varDef.key]}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-2"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-teal-600 to-purple-600 hover:from-teal-700 hover:to-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Rollenspiel starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleplayVariablesDialog;
