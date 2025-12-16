import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import wordpressAPI from '@/services/wordpress-api';
import { usePartner } from '@/context/PartnerContext';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { demoCode } = usePartner();

  const handleStart = async ({ selectedMicrophoneId }) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
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
        console.log('🔁 [SimulatorDeviceSetup] Using preloaded questions for repeat session');
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

      // 3. Start the session
      onStart({
        session: { ...session, questions_json: questions },
        questions: questions,
        scenario: scenario,
        variables: variables,
        selectedMicrophoneId: selectedMicrophoneId,
      });

    } catch (err) {
      console.error('Error starting session:', err);
      setSubmitError(err.message || 'Ein Fehler ist aufgetreten');
      setIsSubmitting(false);
    }
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
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 100,
        }}>
          {submitError}
        </div>
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
