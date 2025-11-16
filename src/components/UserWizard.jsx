import React, { useState } from 'react';
import { Button } from './ui/button';
import { User, Briefcase, Building, ChevronRight, CheckCircle, Sparkles, Target, Zap } from 'lucide-react';

/**
 * UserWizard Component
 *
 * A multi-step wizard that collects user information before starting the interview:
 * - user_name: The applicant's name
 * - position: The position they're applying for
 * - company: The company they're applying to
 */
function UserWizard({ onComplete, initialData = null }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white px-6 py-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">Willkommen!</h1>
                <p className="text-purple-100 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {initialData ? 'Möchtest du deine Daten aktualisieren?' : 'Erzähl uns ein bisschen über dich'}
                </p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="relative flex flex-wrap gap-2 mt-6">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-xs font-medium flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                KI-gestütztes Feedback
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                Realistische Gespräche
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-xs font-medium flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Personalisiert
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 px-6 py-5 border-b border-purple-100/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                  {step}
                </div>
                Schritt {step} von {totalSteps}
              </span>
              <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div className="relative w-full bg-purple-200/50 rounded-full h-3 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-8">
            {/* Step 1: Name */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <User className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Wie heißt du?
                  </h2>
                  <p className="text-slate-600 text-center mb-8">
                    Dein Name wird im Bewerbungsgespräch verwendet
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vollständiger Name
                    </label>
                    <input
                      type="text"
                      value={formData.user_name}
                      onChange={(e) => handleInputChange('user_name', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. Max Mustermann"
                      className={`w-full px-5 py-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.user_name
                          ? 'border-red-400 bg-red-50 focus:ring-red-200'
                          : 'border-purple-200 bg-white hover:border-purple-300 focus:border-indigo-500 focus:ring-indigo-100'
                      }`}
                      autoFocus
                    />
                    {errors.user_name && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="font-semibold">⚠</span> {errors.user_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Position */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                      <Briefcase className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Für welche Position?
                  </h2>
                  <p className="text-slate-600 text-center mb-8">
                    Gib die Stelle an, auf die du dich bewirbst
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stellenbezeichnung
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. Ausbildung zum Mechatroniker"
                      className={`w-full px-5 py-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.position
                          ? 'border-red-400 bg-red-50 focus:ring-red-200'
                          : 'border-emerald-200 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                      autoFocus
                    />
                    {errors.position && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="font-semibold">⚠</span> {errors.position}
                      </p>
                    )}

                    {/* Quick suggestions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500">Vorschläge:</span>
                      {['Ausbildung', 'Praktikum', 'Werkstudent', 'Junior Position'].map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleInputChange('position', suggestion)}
                          className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Company */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <Building className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Bei welchem Unternehmen?
                  </h2>
                  <p className="text-slate-600 text-center mb-8">
                    Gib den Namen des Unternehmens ein
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unternehmensname
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="z.B. BMW AG, Siemens, etc."
                      className={`w-full px-5 py-4 border-2 rounded-xl text-lg focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.company
                          ? 'border-red-400 bg-red-50 focus:ring-red-200'
                          : 'border-purple-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                      autoFocus
                    />
                    {errors.company && (
                      <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                        <span className="font-semibold">⚠</span> {errors.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary Card with modern design */}
                <div className="mt-8 relative overflow-hidden rounded-2xl border-2 border-gradient">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"></div>
                  <div className="relative p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      Zusammenfassung
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <User className="w-5 h-5 text-indigo-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Name</span>
                          <span className="font-semibold text-slate-800">{formData.user_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Position</span>
                          <span className="font-semibold text-slate-800">{formData.position}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <Building className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Unternehmen</span>
                          <span className="font-semibold text-slate-800">{formData.company}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-6 bg-gradient-to-r from-slate-50 to-purple-50/30 border-t border-purple-100/50 flex justify-between gap-4">
            <Button
              onClick={handleBack}
              disabled={step === 1}
              variant="outline"
              className="min-w-[120px] border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Zurück
            </Button>

            <Button
              onClick={handleNext}
              className="min-w-[120px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {step === totalSteps ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Los geht's!
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
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/60 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-600">Deine Daten bleiben privat und sicher</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserWizard;
