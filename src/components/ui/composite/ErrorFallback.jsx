/**
 * ErrorFallback Component
 *
 * A user-friendly error display for API errors, network issues, and other failures.
 * Provides clear messages and actionable options for users.
 */

import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Lock, ServerCrash, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/base/button';

/**
 * Determines the type of error and returns appropriate UI elements
 */
const getErrorConfig = (error, errorCode) => {
  const code = errorCode || error?.code || error?.status;
  const message = error?.message || error?.toString() || '';

  // Network/Connection errors
  if (message.includes('NetworkError') || message.includes('Failed to fetch') || !navigator.onLine) {
    return {
      icon: WifiOff,
      title: 'Keine Verbindung',
      description: 'Bitte überprüfe deine Internetverbindung und versuche es erneut.',
      color: 'amber',
      retryable: true
    };
  }

  // Authentication errors
  if (code === 401 || code === 403 || message.includes('Unauthorized') || message.includes('Forbidden')) {
    return {
      icon: Lock,
      title: 'Zugriff verweigert',
      description: 'Du bist nicht berechtigt, diese Ressource zu sehen. Bitte melde dich erneut an.',
      color: 'amber',
      retryable: false,
      showLogin: true
    };
  }

  // Server errors
  if (code >= 500 || message.includes('Internal Server Error')) {
    return {
      icon: ServerCrash,
      title: 'Serverfehler',
      description: 'Unser Server hat ein Problem. Bitte versuche es in einigen Minuten erneut.',
      color: 'red',
      retryable: true
    };
  }

  // Default/generic error
  return {
    icon: AlertCircle,
    title: 'Ein Fehler ist aufgetreten',
    description: message || 'Etwas ist schief gelaufen. Bitte versuche es erneut.',
    color: 'red',
    retryable: true
  };
};

/**
 * ErrorFallback - Displays errors in a user-friendly way
 *
 * @param {Error|string} error - The error object or message
 * @param {number} errorCode - Optional HTTP status code
 * @param {function} onRetry - Callback to retry the failed operation
 * @param {function} onBack - Callback to go back
 * @param {function} onLogin - Callback to trigger login (for auth errors)
 * @param {string} variant - 'card' | 'inline' | 'fullscreen' (default: 'card')
 */
export function ErrorFallback({
  error,
  errorCode,
  onRetry,
  onBack,
  onLogin,
  variant = 'card'
}) {
  const config = getErrorConfig(error, errorCode);
  const Icon = config.icon;

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      icon: 'text-red-600',
      title: 'text-red-900',
      text: 'text-red-700'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      text: 'text-amber-700'
    }
  };

  const colors = colorClasses[config.color] || colorClasses.red;

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colors.title}`}>{config.title}</p>
          <p className={`text-xs ${colors.text} mt-0.5`}>{config.description}</p>
        </div>
        {config.retryable && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Erneut
          </Button>
        )}
        {config.showLogin && onLogin && (
          <Button
            size="sm"
            onClick={onLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-shrink-0"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Anmelden
          </Button>
        )}
      </div>
    );
  }

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full text-center">
          <div className={`mx-auto mb-6 w-20 h-20 rounded-2xl ${colors.iconBg} flex items-center justify-center`}>
            <Icon className={`w-10 h-10 ${colors.icon}`} />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">{config.title}</h2>
          <p className="text-slate-600 mb-6">{config.description}</p>

          <div className="flex gap-3 justify-center">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
            )}
            {config.retryable && onRetry && (
              <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            )}
            {config.showLogin && onLogin && (
              <Button onClick={onLogin} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Lock className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`rounded-xl ${colors.border} border ${colors.bg} p-6 text-center max-w-md mx-auto`}>
      <div className={`mx-auto mb-4 w-14 h-14 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
        <Icon className={`w-7 h-7 ${colors.icon}`} />
      </div>

      <h3 className={`text-lg font-bold ${colors.title} mb-2`}>{config.title}</h3>
      <p className={`text-sm ${colors.text} mb-4`}>{config.description}</p>

      <div className="flex gap-2 justify-center">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Zurück
          </Button>
        )}
        {config.retryable && onRetry && (
          <Button size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Erneut versuchen
          </Button>
        )}
        {config.showLogin && onLogin && (
          <Button size="sm" onClick={onLogin} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Anmelden
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorFallback;
