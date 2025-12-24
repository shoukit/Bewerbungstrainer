import React from 'react';
import { Video } from 'lucide-react';
import DeviceSetupPage from '@/components/DeviceSetupPage';
import FullscreenLoader from '@/components/ui/fullscreen-loader';
import { ErrorToast } from '@/components/ui/StatusBanner';
import { getWPNonce, getWPApiUrl } from '@/services/wordpress-api';
import useSessionStartup from '@/hooks/useSessionStartup';

/**
 * VideoTrainingDeviceSetup Component
 *
 * Wraps DeviceSetupPage (audio-video mode) and handles:
 * 1. Camera and microphone selection
 * 2. Session creation
 * 3. Question generation
 * 4. Transition to session
 */
const VideoTrainingDeviceSetup = ({
  scenario,
  variables,
  onBack,
  onStart,
}) => {
  const { isSubmitting, submitError, demoCode, startSession, clearError } = useSessionStartup();

  const handleStart = async ({ selectedMicrophoneId, selectedCameraId }) => {
    await startSession(
      async () => {
        const apiUrl = getWPApiUrl();

        // 1. Create session
        const createResponse = await fetch(`${apiUrl}/video-training/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': getWPNonce(),
          },
          body: JSON.stringify({
            scenario_id: scenario.id,
            variables: variables,
            demo_code: demoCode || null,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Fehler beim Erstellen der Session');
        }

        const createData = await createResponse.json();
        const session = createData.data?.session || createData.session;

        if (!session) {
          throw new Error('Keine Session-ID erhalten');
        }

        // 2. Generate questions
        const questionsResponse = await fetch(`${apiUrl}/video-training/sessions/${session.id}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': getWPNonce(),
          },
          body: JSON.stringify({ variables }),
        });

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Fehler beim Generieren der Fragen');
        }

        const questionsData = await questionsResponse.json();
        const questions = questionsData.data?.questions || questionsData.questions || [];

        return {
          session: { ...session, questions },
          questions: questions,
          scenario: scenario,
          variables: variables,
          selectedMicrophoneId: selectedMicrophoneId,
          selectedCameraId: selectedCameraId,
        };
      },
      onStart
    );
  };

  return (
    <>
      <DeviceSetupPage
        mode="audio-video"
        scenario={scenario}
        onBack={onBack}
        onStart={handleStart}
        title={scenario?.title}
        startButtonLabel="Video-Training starten"
        icon={Video}
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

export default VideoTrainingDeviceSetup;
