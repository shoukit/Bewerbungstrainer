import React from 'react';
import { Sparkles } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import { ErrorToast } from '@/components/ui/StatusBanner';
import wordpressAPI from '@/services/wordpress-api';
import useSessionStartup from '@/hooks/useSessionStartup';

/**
 * SimulatorDeviceSetup Component
 *
 * Wraps DeviceSetupPage and handles:
 * 1. Microphone selection
 * 2. Session creation
 * 3. Question generation
 * 4. Transition to session
 */
const SimulatorDeviceSetup = ({
  scenario,
  variables,
  preloadedQuestions,
  onBack,
  onStart,
}) => {
  const { isSubmitting, submitError, demoCode, startSession, clearError } = useSessionStartup();

  const handleStart = async ({ selectedMicrophoneId }) => {
    await startSession(
      async () => {
        // 1. Create session with variables (and optionally preloaded questions)
        const sessionResponse = await wordpressAPI.createSimulatorSession({
          scenario_id: scenario.id,
          variables: variables,
          demo_code: demoCode || null,
          // If we have preloaded questions (repeating a session), include them
          questions: preloadedQuestions || null,
        });

        if (!sessionResponse.success) {
          throw new Error(sessionResponse.message || 'Fehler beim Erstellen der Session');
        }

        const session = sessionResponse.data.session;

        // 2. Generate questions only if not preloaded
        let questions;
        if (preloadedQuestions && preloadedQuestions.length > 0) {
          // Use preloaded questions - skip generation
          questions = preloadedQuestions;
          // Update session with questions_json
          await wordpressAPI.updateSimulatorSessionQuestions(session.id, questions);
        } else {
          // Generate new questions
          const questionsResponse = await wordpressAPI.generateSimulatorQuestions(session.id);

          if (!questionsResponse.success) {
            throw new Error(questionsResponse.message || 'Fehler beim Generieren der Fragen');
          }
          questions = questionsResponse.data.questions;
        }

        return {
          session: { ...session, questions_json: questions },
          questions: questions,
          scenario: scenario,
          variables: variables,
          selectedMicrophoneId: selectedMicrophoneId,
        };
      },
      onStart
    );
  };

  return (
    <>
      <DeviceSetupPage
        mode="audio"
        scenario={scenario}
        onBack={onBack}
        onStart={handleStart}
        title={scenario?.title}
        startButtonLabel="Training starten"
        icon={Sparkles}
      />

      {/* Error Display */}
      {submitError && (
        <ErrorToast
          message={submitError}
          onDismiss={clearError}
        />
      )}

      {/* Fullscreen Loading Overlay */}
      <FullscreenLoader
        isLoading={isSubmitting}
        message="Fragen werden generiert..."
        subMessage="Die KI erstellt personalisierte Fragen basierend auf deinen Angaben."
      />
    </>
  );
};

export default SimulatorDeviceSetup;
