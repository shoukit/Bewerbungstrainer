/**
 * SessionDetailView Component
 *
 * Wrapper component that loads session data and renders RoleplaySessionReport.
 * Used for direct navigation to /verlauf/:sessionType/:sessionId routes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/base/button';

import {
  getRoleplaySessionAnalysis,
  getRoleplayScenario,
} from '@/services/roleplay-feedback-adapter';
import { parseFeedbackJSON, parseAudioAnalysisJSON } from '@/utils/parseJSON';

import RoleplaySessionReport from '@/components/roleplay/RoleplaySessionReport';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SessionDetailView({ session, onBack, onRepeatSession }) {
  const [sessionData, setSessionData] = useState(session);
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse data
  const parsedFeedback = useMemo(
    () => parseFeedbackJSON(sessionData?.feedback_json),
    [sessionData?.feedback_json]
  );

  const parsedAudioAnalysis = useMemo(
    () => parseAudioAnalysisJSON(sessionData?.audio_analysis_json),
    [sessionData?.audio_analysis_json]
  );

  // Load session data
  useEffect(() => {
    loadSessionData();
  }, [session?.id]);

  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fullSession = await getRoleplaySessionAnalysis(session.id);

      // Merge with initial data (preserves data passed during navigation)
      setSessionData((prev) => ({
        ...fullSession,
        feedback_json: fullSession.feedback_json || prev?.feedback_json,
        audio_analysis_json: fullSession.audio_analysis_json || prev?.audio_analysis_json,
        transcript: fullSession.transcript || prev?.transcript,
        conversation_id: fullSession.conversation_id || prev?.conversation_id,
      }));

      // Load scenario
      if (fullSession.scenario_id) {
        try {
          const scenarioData = await getRoleplayScenario(fullSession.scenario_id);
          setScenario(scenarioData);
        } catch (err) {
          console.warn('Could not load scenario:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError(err.message || 'Fehler beim Laden der Session');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Gesprächsanalyse wird geladen...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fehler beim Laden</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack}>
              Zurück
            </Button>
            <Button onClick={loadSessionData}>Erneut versuchen</Button>
          </div>
        </div>
      </div>
    );
  }

  // Use the new unified RoleplaySessionReport
  return (
    <RoleplaySessionReport
      session={sessionData}
      scenario={scenario}
      feedback={parsedFeedback}
      audioAnalysis={parsedAudioAnalysis}
      onBack={onBack}
      onRepeat={scenario && onRepeatSession ? () => onRepeatSession(sessionData, scenario, 'roleplay') : undefined}
    />
  );
}

export default SessionDetailView;
