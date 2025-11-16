import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Star,
  Award,
  Target,
  MessageSquare
} from 'lucide-react';

const FeedbackModal = ({ isOpen, onClose, feedbackContent, isLoading }) => {
  // Parse structured feedback from JSON
  const parsedFeedback = useMemo(() => {
    if (!feedbackContent) return null;

    try {
      // Try to extract JSON from response (remove markdown code blocks if present)
      let jsonString = feedbackContent.trim();

      // Remove markdown code block markers if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (error) {
      console.error('Error parsing feedback JSON:', error);
      // Return null to show fallback view
      return null;
    }
  }, [feedbackContent]);

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
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-slate-700">{rating}/10</span>
      </div>
    );
  };

  const renderStructuredFeedback = () => {
    if (!parsedFeedback) {
      // Fallback: show raw content if parsing failed
      return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  Feedback konnte nicht strukturiert werden
                </p>
                <div className="text-sm text-yellow-700 whitespace-pre-wrap">
                  {feedbackContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
        {/* Summary Section */}
        {parsedFeedback.summary && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Gesamteindruck</h3>
                <p className="text-sm text-blue-800 leading-relaxed">{parsedFeedback.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Section */}
        {parsedFeedback.rating && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">Bewertung</h3>
                <div className="grid grid-cols-2 gap-3">
                  {parsedFeedback.rating.overall !== undefined && (
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Gesamt</p>
                      {renderRatingStars(parsedFeedback.rating.overall)}
                    </div>
                  )}
                  {parsedFeedback.rating.communication !== undefined && (
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Kommunikation</p>
                      {renderRatingStars(parsedFeedback.rating.communication)}
                    </div>
                  )}
                  {parsedFeedback.rating.motivation !== undefined && (
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Motivation</p>
                      {renderRatingStars(parsedFeedback.rating.motivation)}
                    </div>
                  )}
                  {parsedFeedback.rating.professionalism !== undefined && (
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Professionalität</p>
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
          <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
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
          <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 mb-3">Das kann noch besser werden</h3>
                <ul className="space-y-2">
                  {parsedFeedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span className="text-sm text-orange-800 leading-relaxed">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {parsedFeedback.tips && parsedFeedback.tips.length > 0 && (
          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">Praktische Tipps für dich</h3>
                <ul className="space-y-2">
                  {parsedFeedback.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-1" />
                      <span className="text-sm text-indigo-800 leading-relaxed">{tip}</span>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

    return renderStructuredFeedback();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            Dein Bewerbungsgespräch-Feedback
          </DialogTitle>
          <DialogDescription>
            Hier ist deine persönliche Auswertung basierend auf dem geführten Gespräch
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {renderFeedback()}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
