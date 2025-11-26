import React, { useState } from 'react';
import VideoTrainingWizard from './VideoTrainingWizard';
import VideoRecorder from './VideoRecorder';
import VideoFeedback from './VideoFeedback';
import Header from './Header';

/**
 * VideoTrainingApp Component
 *
 * Main app that orchestrates the video interview training flow:
 * 1. Wizard (setup)
 * 2. Recording (interview)
 * 3. Feedback (results)
 */
function VideoTrainingApp() {
  const [currentStep, setCurrentStep] = useState('wizard'); // wizard | recording | feedback
  const [trainingData, setTrainingData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  /**
   * Handle wizard completion
   */
  const handleWizardComplete = (data) => {
    console.log('Wizard completed with data:', data);
    setTrainingData(data);
    setCurrentStep('recording');
  };

  /**
   * Handle recording completion
   */
  const handleRecordingComplete = (results) => {
    console.log('Recording completed with results:', results);
    setAnalysisResults(results);
    setCurrentStep('feedback');
  };

  /**
   * Start new training
   */
  const handleStartNew = () => {
    setTrainingData(null);
    setAnalysisResults(null);
    setCurrentStep('wizard');
  };

  /**
   * Go to home (could navigate to main app or dashboard)
   */
  const handleGoHome = () => {
    window.location.href = '/'; // Or use router navigation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-ocean-50">
      {/* Header */}
      {currentStep === 'wizard' && <Header />}

      {/* Main content */}
      <div className="container mx-auto py-8">
        {currentStep === 'wizard' && (
          <VideoTrainingWizard onComplete={handleWizardComplete} />
        )}

        {currentStep === 'recording' && trainingData && (
          <VideoRecorder
            questions={trainingData.questions}
            cameraStream={trainingData.cameraStream}
            trainingData={trainingData}
            onComplete={handleRecordingComplete}
            onCancel={handleStartNew}
          />
        )}

        {currentStep === 'feedback' && analysisResults && (
          <VideoFeedback
            analysis={analysisResults.analysis}
            trainingData={trainingData}
            onStartNew={handleStartNew}
            onGoHome={handleGoHome}
          />
        )}
      </div>
    </div>
  );
}

export default VideoTrainingApp;
