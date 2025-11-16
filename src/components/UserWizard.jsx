import React, { useState } from 'react';
import { Button } from './ui/button';
import { User, Briefcase, Building, ChevronRight, CheckCircle } from 'lucide-react';

/**
 * UserWizard Component
 *
 * A multi-step wizard that collects user information before starting the interview:
 * - user_name: The applicant's name
 * - position: The position they're applying for
 * - company: The company they're applying to
 */
function UserWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user_name: '',
    position: '',
    company: ''
  });
  const [errors, setErrors] = useState({});

  const totalSteps = 3;

  /**
   * Validates the current step's input
   */
  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1 && !formData.user_name.trim()) {
      newErrors.user_name = 'Bitte gib deinen Namen ein';
    }
    if (currentStep === 2 && !formData.position.trim()) {
      newErrors.position = 'Bitte gib die Position ein';
    }
    if (currentStep === 3 && !formData.company.trim()) {
      newErrors.company = 'Bitte gib das Unternehmen ein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Moves to the next step
   */
  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        // Final step - submit the form
        onComplete(formData);
      }
    }
  };

  /**
   * Moves to the previous step
   */
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  /**
   * Handles Enter key press to move to next step
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold mb-2">Willkommen zum Bewerbungstrainer!</h1>
            <p className="text-blue-100">Bevor wir starten, erzähle uns ein bisschen über dich</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Schritt {step} von {totalSteps}</span>
              <span className="text-sm text-slate-500">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-8">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                    Wie heißt du?
                  </h2>
                  <p className="text-slate-600 text-center mb-6">
                    Dein Name wird im Bewerbungsgespräch verwendet
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) => handleInputChange('user_name', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. Max Mustermann"
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.user_name ? 'border-red-500' : 'border-slate-300'
                      }`}
                      autoFocus
                    />
                    {errors.user_name && (
                      <p className="text-red-500 text-sm mt-2">{errors.user_name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Position */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                    Für welche Position bewirbst du dich?
                  </h2>
                  <p className="text-slate-600 text-center mb-6">
                    Gib die Stelle an, auf die du dich bewirbst
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. Ausbildung zum Mechatroniker"
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                        errors.position ? 'border-red-500' : 'border-slate-300'
                      }`}
                      autoFocus
                    />
                    {errors.position && (
                      <p className="text-red-500 text-sm mt-2">{errors.position}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Company */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                    Bei welchem Unternehmen?
                  </h2>
                  <p className="text-slate-600 text-center mb-6">
                    Gib den Namen des Unternehmens ein
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. BMW AG"
                      className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        errors.company ? 'border-red-500' : 'border-slate-300'
                      }`}
                      autoFocus
                    />
                    {errors.company && (
                      <p className="text-red-500 text-sm mt-2">{errors.company}</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-8 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Zusammenfassung
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Name:</span>
                      <span className="font-medium text-slate-800">{formData.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Position:</span>
                      <span className="font-medium text-slate-800">{formData.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Unternehmen:</span>
                      <span className="font-medium text-slate-800">{formData.company}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-6 bg-slate-50 border-t border-slate-200 flex justify-between">
            <Button
              onClick={handleBack}
              disabled={step === 1}
              variant="outline"
              className="min-w-[100px]"
            >
              Zurück
            </Button>

            <Button
              onClick={handleNext}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
            >
              {step === totalSteps ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Fertig
                </>
              ) : (
                <>
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Deine Daten werden nur für dieses Bewerbungsgespräch verwendet</p>
        </div>
      </div>
    </div>
  );
}

export default UserWizard;
