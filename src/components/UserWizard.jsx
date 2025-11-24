import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { User, Briefcase, Building, ChevronRight, CheckCircle, Sparkles, Target, Zap, MessageCircle } from 'lucide-react';
import wordpressAPI from '../services/wordpress-api';
import ConversationStyleSelector from './ConversationStyleSelector';

console.log('📦 [USER_WIZARD] UserWizard module loaded');

/**
 * UserWizard Component
 *
 * A multi-step wizard that collects user information before starting the interview:
 * - user_name: The applicant's name (auto-filled from WordPress if available)
 * - position: The position they're applying for
 * - company: The company they're applying to
 */
function UserWizard({ onComplete, initialData = null }) {
  console.log('🧙 [USER_WIZARD] UserWizard component render');
  console.log('🧙 [USER_WIZARD] Props:', {
    onComplete: typeof onComplete,
    initialData
  });
  // Check if running in WordPress
  const isWordPress = wordpressAPI.isWordPress();
  const wpUser = isWordPress ? wordpressAPI.getCurrentUser() : null;

  // Auto-fill user_name from WordPress if available (only if logged in)
  const isLoggedIn = wpUser?.id && wpUser.id > 0;
  const defaultUserName = isLoggedIn ? (wpUser?.firstName || wpUser?.name || '') : '';

  // Always start at step 1 to allow name editing for all users (logged in or not)
  // The name will be pre-filled for logged-in users but can be changed
  const initialStep = 1;
  const totalSteps = 4; // 4 steps - name, position, company, conversation_style

  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState(initialData || {
    user_name: defaultUserName,
    position: '',
    company: '',
    conversation_style: 'professional' // Default style
  });
  const [errors, setErrors] = useState({});

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
  const handleNext = useCallback(() => {
    console.log('➡️ [USER_WIZARD] handleNext called, step:', step);
    if (validateStep(step)) {
      if (step < totalSteps) {
        console.log('➡️ [USER_WIZARD] Moving to step:', step + 1);
        setStep(step + 1);
      } else {
        // Final step - submit the form
        console.log('✅ [USER_WIZARD] Final step - calling onComplete');
        console.log('✅ [USER_WIZARD] formData:', formData);
        console.log('✅ [USER_WIZARD] onComplete type:', typeof onComplete);
        onComplete(formData);
      }
    } else {
      console.log('❌ [USER_WIZARD] Validation failed for step:', step);
    }
  }, [step, totalSteps, formData, onComplete, validateStep]);

  /**
   * Moves to the previous step
   */
  const handleBack = () => {
    if (step > initialStep) {
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
    <div className="min-h-screen bg-gradient-to-br from-ocean-blue-100 via-ocean-blue-200 to-ocean-blue-300 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-deep-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-ocean-blue-600 via-ocean-deep-600 to-ocean-teal-500 text-white px-6 py-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">Willkommen!</h1>
                <p className="text-ocean-blue-100 flex items-center gap-2">
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
          <div className="bg-gradient-to-r from-ocean-blue-50/50 to-ocean-teal-50/50 px-6 py-5 border-b border-ocean-blue-100/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-ocean-deep-900 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-ocean-blue-100 flex items-center justify-center text-xs font-bold text-ocean-blue-600">
                  {step}
                </div>
                Schritt {step} von {totalSteps}
              </span>
              <span className="text-sm font-medium text-ocean-deep-600 bg-ocean-blue-100 px-3 py-1 rounded-full">
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div className="relative w-full bg-ocean-blue-200/50 rounded-full h-3 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-ocean-blue-500 via-ocean-deep-500 to-ocean-teal-500 rounded-full transition-all duration-500 ease-out shadow-lg"
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
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 flex items-center justify-center shadow-xl">
                      <User className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-ocean-blue-600 to-ocean-deep-600 bg-clip-text text-transparent">
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
                          : 'border-ocean-blue-200 bg-white hover:border-ocean-blue-300 focus:border-ocean-blue-500 focus:ring-ocean-blue-100'
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
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-600 flex items-center justify-center shadow-xl">
                      <Briefcase className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-ocean-deep-400 to-ocean-deep-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-ocean-teal-600 to-ocean-teal-700 bg-clip-text text-transparent">
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
                          : 'border-ocean-teal-200 bg-white hover:border-ocean-teal-300 focus:border-ocean-teal-500 focus:ring-ocean-teal-100'
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
                          className="text-xs px-2.5 py-1 bg-ocean-teal-50 text-ocean-teal-700 rounded-full hover:bg-ocean-teal-100 transition-colors border border-ocean-teal-200"
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
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-deep-500 to-ocean-deep-600 flex items-center justify-center shadow-xl">
                      <Building className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 text-center mb-2 bg-gradient-to-r from-ocean-deep-600 to-ocean-blue-600 bg-clip-text text-transparent">
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
                          : 'border-ocean-blue-200 bg-white hover:border-ocean-blue-300 focus:border-ocean-blue-500 focus:ring-ocean-blue-100'
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

              </div>
            )}

            {/* Step 4: Conversation Style */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                      <MessageCircle className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Wie soll das Gespräch sein?
                  </h2>
                  <p className="text-slate-600 text-center mb-8 text-base">
                    Wähle den Gesprächsstil, der am besten zu deiner Vorbereitung passt
                  </p>

                  {/* Conversation Style Selector */}
                  <ConversationStyleSelector
                    selectedStyle={formData.conversation_style}
                    onStyleChange={(styleId) => handleInputChange('conversation_style', styleId)}
                  />

                  {/* Info box */}
                  <div className="mt-6 relative overflow-hidden rounded-2xl border-2 border-ocean-blue-200/60">
                    <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-50 to-ocean-teal-50"></div>
                    <div className="relative p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-ocean-deep-800 mb-1">💡 Tipp</p>
                        <p className="text-sm text-ocean-deep-700">
                          Du kannst den Gesprächsstil auch während des Interviews anpassen, falls du mehr Herausforderung oder Unterstützung brauchst.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Summary Card */}
                <div className="mt-8 relative overflow-hidden rounded-2xl border-2 border-gradient">
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-50 via-ocean-blue-100 to-ocean-teal-50"></div>
                  <div className="relative p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      Zusammenfassung
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <User className="w-5 h-5 text-ocean-blue-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Name</span>
                          <span className="font-semibold text-slate-800">{formData.user_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <Briefcase className="w-5 h-5 text-ocean-teal-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Position</span>
                          <span className="font-semibold text-slate-800">{formData.position}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <Building className="w-5 h-5 text-ocean-deep-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Unternehmen</span>
                          <span className="font-semibold text-slate-800">{formData.company}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/60">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <span className="text-xs text-slate-500 block">Gesprächsstil</span>
                          <span className="font-semibold text-slate-900 capitalize">{formData.conversation_style === 'friendly' ? '😊 Freundlich' : formData.conversation_style === 'critical' ? '🔍 Kritisch' : '📋 Sachlich'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 py-6 bg-gradient-to-r from-ocean-blue-50 to-ocean-teal-50/30 border-t border-ocean-blue-100/50 flex justify-between gap-4">
            <Button
              onClick={handleBack}
              disabled={step === initialStep}
              variant="outline"
              className="min-w-[120px] border-2 border-slate-300 hover:border-ocean-blue-400 hover:bg-ocean-blue-50 transition-all duration-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Zurück
            </Button>

            <Button
              onClick={handleNext}
              className="min-w-[120px] bg-gradient-to-r from-ocean-blue-600 via-ocean-deep-600 to-ocean-teal-500 hover:from-ocean-blue-700 hover:via-ocean-deep-700 hover:to-ocean-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
