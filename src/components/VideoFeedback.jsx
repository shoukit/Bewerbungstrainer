import React from 'react';
import { Button } from './ui/button';
import { CheckCircle, TrendingUp, Lightbulb, Star, Award, Home, RotateCcw } from 'lucide-react';

/**
 * VideoFeedback Component
 *
 * Displays detailed AI analysis results from video interview:
 * - Overall score
 * - Category scores with detailed feedback
 * - Strengths and positive surprises
 * - Improvement suggestions
 * - Practical tips
 */
function VideoFeedback({ analysis, trainingData, onStartNew, onGoHome }) {
  if (!analysis) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800">Keine Analysedaten verfügbar.</p>
        </div>
      </div>
    );
  }

  const { overall_score, categories, staerken_und_positive_ueberraschungen, kurzfeedback_fuer_user } = analysis;

  /**
   * Get color based on score
   */
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get background color based on score
   */
  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  /**
   * Render score circle
   */
  const ScoreCircle = ({ score, size = 'large' }) => {
    const isLarge = size === 'large';
    const radius = isLarge ? 70 : 45;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    return (
      <div className="relative">
        <svg
          className={isLarge ? 'w-40 h-40' : 'w-24 h-24'}
          viewBox="0 0 160 160"
        >
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={isLarge ? '12' : '8'}
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth={isLarge ? '12' : '8'}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${isLarge ? 'text-4xl' : 'text-2xl'} ${getScoreColor(score)}`}>
            {Math.round(score)}
          </span>
        </div>
      </div>
    );
  };

  /**
   * Category labels in German
   */
  const categoryLabels = {
    auftreten: 'Auftreten',
    selbstbewusstsein: 'Selbstbewusstsein',
    koerpersprache: 'Körpersprache',
    kommunikation: 'Kommunikation',
    professionalitaet: 'Professionalität',
    persoenliche_wirkung: 'Persönliche Wirkung'
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Award className="w-12 h-12 text-ocean-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">
            Dein Video-Interview Feedback
          </h1>
        </div>
        <p className="text-xl text-gray-600">
          Analyse für: {trainingData.position}
          {trainingData.company && ` bei ${trainingData.company}`}
        </p>
      </div>

      {/* Overall Score */}
      <div className="p-8 bg-gradient-to-br from-ocean-50 to-blue-50 border-2 border-ocean-200 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Gesamtbewertung
            </h2>
            {kurzfeedback_fuer_user && (
              <p className="text-lg text-gray-700 leading-relaxed">
                {kurzfeedback_fuer_user}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <ScoreCircle score={overall_score || 0} size="large" />
          </div>
        </div>
      </div>

      {/* Strengths */}
      {staerken_und_positive_ueberraschungen && staerken_und_positive_ueberraschungen.length > 0 && (
        <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center mb-4">
            <Star className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-2xl font-bold text-green-900">
              Deine Stärken & positive Überraschungen
            </h3>
          </div>
          <ul className="space-y-2">
            {staerken_und_positive_ueberraschungen.map((strength, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Scores */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Detaillierte Bewertung nach Kategorien
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories && Object.entries(categories).map(([key, data]) => (
            <div
              key={key}
              className={`p-6 border-2 rounded-xl ${getScoreBgColor(data.score || 0)}`}
            >
              {/* Category header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {categoryLabels[key] || key}
                </h3>
                <ScoreCircle score={data.score || 0} size="small" />
              </div>

              {/* Assessment */}
              {data.einschaetzung && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Einschätzung:</p>
                  <p className="text-gray-800">{data.einschaetzung}</p>
                </div>
              )}

              {/* Improvement potential */}
              {data.verbesserungspotenziale && data.verbesserungspotenziale.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-600 mr-2" />
                    <p className="text-sm font-semibold text-gray-700">Verbesserungspotenziale:</p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {data.verbesserungspotenziale.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-600 mr-2">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practical tips */}
              {data.praktische_tipps && data.praktische_tipps.length > 0 && (
                <div>
                  <div className="flex items-center mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mr-2" />
                    <p className="text-sm font-semibold text-gray-700">Praktische Tipps:</p>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {data.praktische_tipps.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">→</span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t-2 border-gray-200">
        <Button
          onClick={onStartNew}
          className="bg-ocean-600 hover:bg-ocean-700 text-white px-8 py-3 text-lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Neue Wirkungs-Analyse starten
        </Button>
        <Button
          onClick={onGoHome}
          variant="outline"
          className="px-8 py-3 text-lg"
        >
          <Home className="w-5 h-5 mr-2" />
          Zur Startseite
        </Button>
      </div>

      {/* Additional info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Speichere dieses Feedback und arbeite gezielt an den genannten Punkten.
          Mit jedem Training wirst du besser!
        </p>
      </div>
    </div>
  );
}

export default VideoFeedback;
