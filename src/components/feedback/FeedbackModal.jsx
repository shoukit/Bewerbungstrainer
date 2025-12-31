/**
 * FeedbackModal Component
 *
 * Displays structured feedback after a roleplay session.
 * Includes ratings, strengths, improvements, tips, and audio analysis.
 */

import React, { useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/base/dialog';
import { Button } from '@/components/ui/base/button';
import {
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Star,
  Award,
  Target,
  MessageSquare,
  Mic2,
  Volume2,
  Timer,
  Activity,
  AlertTriangle,
  Music2,
  BarChart3,
} from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, feedbackContent, audioAnalysisContent, isLoading }) => {
  // Create a stable callback for onOpenChange
  const handleOpenChange = useCallback(
    (open) => {
      if (!open) {
        onClose();
      }
    },
    [onClose]
  );

  // Parse structured feedback from JSON
  const parsedFeedback = useMemo(() => {
    if (!feedbackContent) return null;

    try {
      let jsonString = feedbackContent.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing feedback JSON:', error);
      return null;
    }
  }, [feedbackContent]);

  // Parse audio analysis from JSON
  const parsedAudioAnalysis = useMemo(() => {
    if (!audioAnalysisContent) return null;

    try {
      let jsonString = audioAnalysisContent.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing audio analysis JSON:', error);
      return null;
    }
  }, [audioAnalysisContent]);

  // Render rating stars
  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'fill-amber-400 text-amber-400'
                : i === fullStars && hasHalfStar
                  ? 'fill-amber-200 text-amber-400'
                  : 'text-slate-200'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-700">{rating}/10</span>
      </div>
    );
  };

  const renderStructuredFeedback = () => {
    if (!parsedFeedback) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  Feedback konnte nicht strukturiert werden
                </p>
                <div className="text-sm text-amber-700 whitespace-pre-wrap">{feedbackContent}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* Summary Section */}
        {parsedFeedback.summary && (
          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900 mb-2">Gesamteindruck</h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {parsedFeedback.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Section - Indigo Theme */}
        {parsedFeedback.rating && (
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">Bewertung</h3>
                <div className="grid grid-cols-2 gap-3">
                  {parsedFeedback.rating.overall !== undefined && (
                    <div>
                      <p className="text-xs text-indigo-700 mb-1">Gesamt</p>
                      {renderRatingStars(parsedFeedback.rating.overall)}
                    </div>
                  )}
                  {parsedFeedback.rating.communication !== undefined && (
                    <div>
                      <p className="text-xs text-indigo-700 mb-1">Kommunikation</p>
                      {renderRatingStars(parsedFeedback.rating.communication)}
                    </div>
                  )}
                  {parsedFeedback.rating.motivation !== undefined && (
                    <div>
                      <p className="text-xs text-indigo-700 mb-1">Motivation</p>
                      {renderRatingStars(parsedFeedback.rating.motivation)}
                    </div>
                  )}
                  {parsedFeedback.rating.professionalism !== undefined && (
                    <div>
                      <p className="text-xs text-indigo-700 mb-1">Professionalität</p>
                      {renderRatingStars(parsedFeedback.rating.professionalism)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strengths Section */}
        {parsedFeedback.strengths && parsedFeedback.strengths.length > 0 && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-3">Das hast du gut gemacht</h3>
                <ul className="space-y-2">
                  {parsedFeedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span className="text-sm text-green-800 leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Improvements Section */}
        {parsedFeedback.improvements && parsedFeedback.improvements.length > 0 && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-3">
                  Das kann noch besser werden
                </h3>
                <ul className="space-y-2">
                  {parsedFeedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span className="text-sm text-amber-800 leading-relaxed">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {parsedFeedback.tips && parsedFeedback.tips.length > 0 && (
          <div className="p-4 bg-violet-50 border-l-4 border-violet-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-violet-900 mb-3">
                  Praktische Tipps für dich
                </h3>
                <ul className="space-y-2">
                  {parsedFeedback.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-violet-600 flex-shrink-0 mt-1" />
                      <span className="text-sm text-violet-800 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAudioAnalysis = () => {
    if (!parsedAudioAnalysis) {
      return null;
    }

    // Check if this is an error message
    if (parsedAudioAnalysis.error) {
      return (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-amber-300">
            <Mic2 className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-amber-900">Audio-Analyse</h2>
          </div>

          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-2">
                  Audio-Analyse nicht verfügbar
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {parsedAudioAnalysis.summary}
                </p>
                {parsedAudioAnalysis.errorMessage && (
                  <div className="text-xs text-amber-700 mt-3 p-3 bg-amber-100 rounded-lg">
                    <span className="font-semibold">Details:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {parsedAudioAnalysis.errorMessage}
                    </pre>
                  </div>
                )}
                {parsedAudioAnalysis.troubleshooting &&
                  parsedAudioAnalysis.troubleshooting.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-amber-900 mb-2">Lösungsvorschläge:</p>
                      <ul className="space-y-1">
                        {parsedAudioAnalysis.troubleshooting.map((tip, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-xs text-amber-800"
                          >
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {!parsedAudioAnalysis.troubleshooting && (
                  <p className="text-xs text-amber-600 mt-3">
                    <span className="font-semibold">Tipp:</span> Dies kann passieren, wenn das
                    Mikrofon bereits von ElevenLabs verwendet wird. Versuche das Gespräch erneut zu
                    starten.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 mt-8">
        {/* Audio Analysis Header */}
        <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-300">
          <Mic2 className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-indigo-900">Audio-Analyse deiner Sprechweise</h2>
        </div>

        {/* Summary */}
        {parsedAudioAnalysis.summary && (
          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <Music2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900 mb-2">Gesamteindruck</h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {parsedAudioAnalysis.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Audio Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clarity */}
          {parsedAudioAnalysis.clarity && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Volume2 className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Deutlichkeit</h4>
                  {renderRatingStars(parsedAudioAnalysis.clarity.rating)}
                  <p className="text-xs text-slate-700 mt-2">
                    {parsedAudioAnalysis.clarity.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pace */}
          {parsedAudioAnalysis.pace && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Timer className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Sprechgeschwindigkeit</h4>
                  {renderRatingStars(parsedAudioAnalysis.pace.rating)}
                  {parsedAudioAnalysis.pace.wordsPerMinute && (
                    <p className="text-xs text-slate-600 mt-1">
                      ~{parsedAudioAnalysis.pace.wordsPerMinute} Wörter/Min
                    </p>
                  )}
                  <p className="text-xs text-slate-700 mt-2">{parsedAudioAnalysis.pace.feedback}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filler Words */}
          {parsedAudioAnalysis.fillerWords && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Füllwörter</h4>
                  {renderRatingStars(parsedAudioAnalysis.fillerWords.rating)}
                  {parsedAudioAnalysis.fillerWords.count !== undefined && (
                    <p className="text-xs text-amber-700 mt-1">
                      Anzahl: {parsedAudioAnalysis.fillerWords.count}
                    </p>
                  )}
                  {parsedAudioAnalysis.fillerWords.examples &&
                    parsedAudioAnalysis.fillerWords.examples.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Beispiele: {parsedAudioAnalysis.fillerWords.examples.join(', ')}
                      </p>
                    )}
                  <p className="text-xs text-amber-800 mt-2">
                    {parsedAudioAnalysis.fillerWords.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nervousness */}
          {parsedAudioAnalysis.nervousness && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Nervosität</h4>
                  {renderRatingStars(parsedAudioAnalysis.nervousness.rating)}
                  {parsedAudioAnalysis.nervousness.indicators &&
                    parsedAudioAnalysis.nervousness.indicators.length > 0 && (
                      <ul className="text-xs text-red-700 mt-2 space-y-1">
                        {parsedAudioAnalysis.nervousness.indicators.map((indicator, idx) => (
                          <li key={idx}>• {indicator}</li>
                        ))}
                      </ul>
                    )}
                  <p className="text-xs text-red-800 mt-2">
                    {parsedAudioAnalysis.nervousness.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confidence */}
          {parsedAudioAnalysis.confidence && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Selbstsicherheit</h4>
                  {renderRatingStars(parsedAudioAnalysis.confidence.rating)}
                  <p className="text-xs text-green-700 mt-2">
                    {parsedAudioAnalysis.confidence.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tonal Modulation - Violet instead of Ocean Teal */}
          {parsedAudioAnalysis.tonalModulation && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-start gap-3">
                <BarChart3 className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-violet-900 mb-2">Tonmodulation</h4>
                  {renderRatingStars(parsedAudioAnalysis.tonalModulation.rating)}
                  <p className="text-xs text-violet-700 mt-2">
                    {parsedAudioAnalysis.tonalModulation.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strengths */}
        {parsedAudioAnalysis.strengths && parsedAudioAnalysis.strengths.length > 0 && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-3">
                  Stärken deiner Sprechweise
                </h3>
                <ul className="space-y-2">
                  {parsedAudioAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span className="text-sm text-green-800 leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Overall Improvement */}
        {parsedAudioAnalysis.overallImprovement &&
          parsedAudioAnalysis.overallImprovement.length > 0 && (
            <div className="p-4 bg-violet-50 border-l-4 border-violet-500 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-violet-900 mb-3">
                    Verbesserungsvorschläge
                  </h3>
                  <ul className="space-y-2">
                    {parsedAudioAnalysis.overallImprovement.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-violet-600 flex-shrink-0 mt-1" />
                        <span className="text-sm text-violet-800 leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderFeedback = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">Feedback wird generiert...</p>
          <p className="mt-2 text-sm text-slate-500">Das kann einen Moment dauern</p>
        </div>
      );
    }

    if (!feedbackContent) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Kein Feedback verfügbar.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
        {renderStructuredFeedback()}
        {renderAudioAnalysis()}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            Dein Bewerbungsgespräch-Feedback
          </DialogTitle>
          <DialogDescription>
            Hier ist deine persönliche Auswertung basierend auf dem geführten Gespräch
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">{renderFeedback()}</div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-slate-100">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
