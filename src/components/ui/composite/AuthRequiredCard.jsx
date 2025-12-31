/**
 * AuthRequiredCard Component
 *
 * A user-friendly card that is displayed when authentication is required.
 * Shows a message encouraging the user to log in, with an optional action button.
 */

import React from 'react';
import { LogIn, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/base/button';

/**
 * AuthRequiredCard - Displays when a feature requires login
 *
 * @param {string} title - Main headline (default: "Anmeldung erforderlich")
 * @param {string} description - Description text explaining why login is needed
 * @param {string} featureName - Name of the feature that requires auth (for personalized message)
 * @param {function} onLogin - Callback to trigger login modal
 * @param {string} variant - 'card' | 'inline' | 'fullscreen' (default: 'card')
 */
export function AuthRequiredCard({
  title = "Anmeldung erforderlich",
  description,
  featureName,
  onLogin,
  variant = 'card'
}) {
  const defaultDescription = featureName
    ? `Um ${featureName} zu nutzen, melde dich bitte an.`
    : "Melde dich an, um diese Funktion zu nutzen und deinen Fortschritt zu speichern.";

  const finalDescription = description || defaultDescription;

  // Inline variant - minimal, for embedding in existing cards
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Lock className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-indigo-900">{title}</p>
          <p className="text-xs text-indigo-700 mt-0.5">{finalDescription}</p>
        </div>
        {onLogin && (
          <Button
            size="sm"
            onClick={onLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            Anmelden
          </Button>
        )}
      </div>
    );
  }

  // Fullscreen variant - for pages that are completely auth-gated
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl mx-auto">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{title}</h2>
          <p className="text-slate-600 mb-6">{finalDescription}</p>

          {/* Benefits */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-slate-800 mb-2">Als angemeldeter Nutzer kannst du:</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="text-indigo-500">✓</span>
                Deinen Fortschritt speichern
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-500">✓</span>
                Frühere Trainings erneut ansehen
              </li>
              <li className="flex items-center gap-2">
                <span className="text-indigo-500">✓</span>
                Personalisierte Empfehlungen erhalten
              </li>
            </ul>
          </div>

          {/* CTA */}
          {onLogin && (
            <Button
              size="lg"
              onClick={onLogin}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:via-indigo-800 hover:to-violet-700 text-white shadow-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Jetzt anmelden
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center max-w-md mx-auto">
      {/* Icon */}
      <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
        <Lock className="w-8 h-8 text-white" />
      </div>

      {/* Text */}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{finalDescription}</p>

      {/* CTA */}
      {onLogin && (
        <Button
          onClick={onLogin}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Anmelden
        </Button>
      )}
    </div>
  );
}

export default AuthRequiredCard;
