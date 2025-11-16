import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import Header from './components/Header';
import FeedbackModal from './components/FeedbackModal';
import UserWizard from './components/UserWizard';
import { Button } from './components/ui/button';
import { generateInterviewFeedback, generateAudioAnalysis, listAvailableModels } from './services/gemini';
import { MessageSquare, StopCircle, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

function App() {
  const [showWizard, setShowWizard] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [microphoneError, setMicrophoneError] = useState(null);
  const [audioAnalysisContent, setAudioAnalysisContent] = useState('');
  const [audioRecordingError, setAudioRecordingError] = useState(null);

  // Track if we're currently starting a session to prevent double-starts
  const isStartingSession = useRef(false);
  const connectionTimestamp = useRef(null);

  // Audio recording references
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordedAudioBlobRef = useRef(null);

  // Environment variables
  const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // ElevenLabs Conversation Hook with extensive logging
  const conversation = useConversation({
    overrides: {
      agent: {
        language: "de", // German language
        firstMessage: userData
          ? `Guten Tag ${userData.user_name}! Schön, dass Sie da sind. Ich freue mich, dass Sie sich für die Position als ${userData.position} bei ${userData.company} bewerben. Erzählen Sie mir doch bitte zunächst etwas über sich selbst und warum Sie sich für diese Position interessieren.`
          : "Guten Tag! Schön, dass Sie da sind. Erzählen Sie mir doch bitte zunächst etwas über sich selbst.",
      },
    },
    onConnect: () => {
      const now = Date.now();
      const timeSinceStart = connectionTimestamp.current ? now - connectionTimestamp.current : 0;
      console.log('🟢 [CONNECTED] ElevenLabs WebSocket connected');
      console.log(`   Time since start: ${timeSinceStart}ms`);
      console.log(`   Conversation status: ${conversation.status}`);
      console.log(`   Microphone muted: ${conversation.micMuted}`);
      isStartingSession.current = false;
    },
    onDisconnect: (event) => {
      const now = Date.now();
      const timeSinceStart = connectionTimestamp.current ? now - connectionTimestamp.current : 0;
      console.log('🔴 [DISCONNECTED] ElevenLabs WebSocket disconnected');
      console.log(`   Time since start: ${timeSinceStart}ms`);
      console.log(`   Conversation status: ${conversation.status}`);
      console.log(`   Disconnect event:`, event);
      console.log(`   Close code:`, event?.code);
      console.log(`   Close reason:`, event?.reason);
      console.log(`   Was clean:`, event?.wasClean);
      isStartingSession.current = false;

      // Set user-friendly error message based on close code
      if (event?.code === 1002 || event?.code === 1003) {
        setMicrophoneError('Agent-Konfigurationsfehler: Bitte überprüfe die Agent-Einstellungen im ElevenLabs Dashboard.');
      } else if (event?.code === 1006) {
        setMicrophoneError('Verbindung unerwartet getrennt. Möglicherweise stimmt die Agent-Konfiguration nicht.');
      } else if (event?.reason) {
        setMicrophoneError(`Verbindung getrennt: ${event.reason}`);
      }
    },
    onMessage: (message) => {
      console.log('💬 [MESSAGE] Received:', {
        source: message.source,
        message: message.message,
        timestamp: new Date().toISOString()
      });
      // Store messages for transcript
      setConversationMessages(prev => [...prev, message]);
    },
    onError: (error) => {
      console.error('❌ [ERROR] Conversation error:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        conversationStatus: conversation.status,
        timestamp: new Date().toISOString()
      });
      isStartingSession.current = false;
      setMicrophoneError(error?.message || 'Unknown error occurred');
    },
    onModeChange: (mode) => {
      console.log('🔄 [MODE_CHANGE] New mode:', mode);
    },
  });

  /**
   * Starts recording audio from the user's microphone
   */
  const startAudioRecording = async () => {
    console.log('🎙️ [AUDIO REC] Starting audio recording...');

    try {
      setAudioRecordingError(null); // Clear any previous errors

      // Request microphone access
      // Note: This might fail if ElevenLabs is already using the microphone
      // In that case, we'll fallback to no audio analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎙️ [AUDIO REC] Microphone stream obtained');
      console.log('🎙️ [AUDIO REC] Audio tracks:', stream.getAudioTracks().length);

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`🎙️ [AUDIO REC] Audio chunk recorded: ${event.data.size} bytes (Total chunks: ${audioChunksRef.current.length})`);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = () => {
        console.log('🎙️ [AUDIO REC] Recording stopped');
        console.log(`🎙️ [AUDIO REC] Total chunks collected: ${audioChunksRef.current.length}`);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        recordedAudioBlobRef.current = audioBlob;
        console.log(`🎙️ [AUDIO REC] Total audio size: ${audioBlob.size} bytes`);

        if (audioBlob.size === 0) {
          console.warn('⚠️ [AUDIO REC] Warning: Audio blob is empty! No audio was recorded.');
          setAudioRecordingError('Keine Audio-Daten aufgenommen');
        }

        // Stop all tracks
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎙️ [AUDIO REC] Stopped track:', track.label);
        });
      };

      // Handle errors during recording
      mediaRecorder.onerror = (event) => {
        console.error('❌ [AUDIO REC] MediaRecorder error:', event.error);
        setAudioRecordingError(`Aufnahmefehler: ${event.error?.message || 'Unbekannter Fehler'}`);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      console.log('✅ [AUDIO REC] Recording started successfully');
      console.log(`🎙️ [AUDIO REC] Recording state: ${mediaRecorder.state}`);

    } catch (error) {
      console.error('❌ [AUDIO REC] Error starting audio recording:', error);
      console.error('❌ [AUDIO REC] Error name:', error.name);
      console.error('❌ [AUDIO REC] Error message:', error.message);

      // Set user-friendly error message
      if (error.name === 'NotAllowedError') {
        setAudioRecordingError('Mikrofon-Zugriff wurde verweigert');
      } else if (error.name === 'NotFoundError') {
        setAudioRecordingError('Kein Mikrofon gefunden');
      } else if (error.name === 'NotReadableError') {
        setAudioRecordingError('Mikrofon wird bereits verwendet (möglicherweise durch ElevenLabs)');
      } else {
        setAudioRecordingError(`Aufnahmefehler: ${error.message}`);
      }
    }
  };

  /**
   * Stops recording audio
   */
  const stopAudioRecording = () => {
    console.log('🛑 [AUDIO REC] Stopping audio recording...');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('✅ [AUDIO REC] Recording stopped successfully');
    } else {
      console.log('⚠️ [AUDIO REC] No active recording to stop');
    }
  };

  /**
   * Handles the end of interview and generates feedback
   */
  const handleEndInterview = async () => {
    // Stop audio recording first
    stopAudioRecording();

    // End the conversation
    if (conversation.status === 'connected') {
      await conversation.endSession();
    }

    setIsRequestingFeedback(true);
    setShowFeedbackModal(true);
    setFeedbackContent(''); // Clear previous feedback
    setAudioAnalysisContent(''); // Clear previous audio analysis

    try {
      // Build transcript from collected messages
      let transcript = '';
      if (conversationMessages.length > 0) {
        transcript = conversationMessages
          .map(msg => {
            const role = msg.source === 'ai' ? 'Herr Müller' : 'Bewerber';
            return `${role}: ${msg.message}`;
          })
          .join('\n\n');
      }

      // Fallback to mock transcript if no messages collected
      if (!transcript || transcript.trim().length === 0) {
        transcript = `
Herr Müller: Guten Tag! Schön, dass Sie da sind. Erzählen Sie mir doch bitte zunächst etwas über sich selbst.

Bewerber: [Ihre Antworten wurden hier aufgezeichnet]

Herr Müller: Das klingt interessant. Warum haben Sie sich für eine Ausbildung zum Mechatroniker bei BMW entschieden?

Bewerber: [Ihre Antworten wurden hier aufgezeichnet]

Herr Müller: Können Sie mir von einer Situation erzählen, in der Sie ein technisches Problem gelöst haben?

Bewerber: [Ihre Antworten wurden hier aufgezeichnet]
        `.trim();
      }

      // Generate both text feedback and audio analysis in parallel
      const feedbackPromise = generateInterviewFeedback(transcript, GEMINI_API_KEY);

      let audioAnalysisPromise = Promise.resolve(null);
      if (recordedAudioBlobRef.current && recordedAudioBlobRef.current.size > 0) {
        console.log('🎙️ [FEEDBACK] Analyzing recorded audio...');
        console.log(`🎙️ [FEEDBACK] Audio blob size: ${recordedAudioBlobRef.current.size} bytes`);
        audioAnalysisPromise = generateAudioAnalysis(recordedAudioBlobRef.current, GEMINI_API_KEY)
          .catch(error => {
            console.error('❌ [FEEDBACK] Audio analysis failed:', error);
            // Return a structured error message that will be displayed in the UI
            return JSON.stringify({
              summary: "Die Audio-Analyse konnte leider nicht durchgeführt werden.",
              error: true,
              errorMessage: error.message
            });
          });
      } else {
        console.warn('⚠️ [FEEDBACK] No audio recorded, skipping audio analysis');
        console.warn(`⚠️ [FEEDBACK] Audio blob size: ${recordedAudioBlobRef.current?.size || 0} bytes`);
        console.warn(`⚠️ [FEEDBACK] Audio recording error: ${audioRecordingError || 'None'}`);

        // Provide a message explaining why audio analysis is not available
        const reason = audioRecordingError || 'Es wurde kein Audio aufgenommen';
        audioAnalysisPromise = Promise.resolve(JSON.stringify({
          summary: `Audio-Analyse nicht verfügbar: ${reason}`,
          error: true,
          errorMessage: reason
        }));
      }

      // Wait for both to complete
      const [feedback, audioAnalysis] = await Promise.all([feedbackPromise, audioAnalysisPromise]);

      setFeedbackContent(feedback);
      if (audioAnalysis) {
        console.log('📊 [FEEDBACK] Audio analysis result received');
        console.log(`📊 [FEEDBACK] Audio analysis length: ${audioAnalysis.length} characters`);
        setAudioAnalysisContent(audioAnalysis);
      } else {
        console.log('⚠️ [FEEDBACK] No audio analysis available');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedbackContent(
        `Entschuldigung, es gab einen Fehler bei der Feedback-Generierung:\n\n${error.message}\n\nBitte stelle sicher, dass der GEMINI_API_KEY korrekt konfiguriert ist.`
      );
    } finally {
      setIsRequestingFeedback(false);
    }
  };

  /**
   * Check microphone permissions before starting
   */
  const checkMicrophonePermissions = async () => {
    console.log('🎤 [MIC_CHECK] Checking microphone permissions...');

    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support microphone access');
      }

      // Request microphone permission
      console.log('🎤 [MIC_CHECK] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎤 [MIC_CHECK] ✅ Microphone permission granted');
      console.log('   Audio tracks:', stream.getAudioTracks().length);
      console.log('   Track settings:', stream.getAudioTracks()[0]?.getSettings());

      // Stop the test stream immediately
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('🎤 [MIC_CHECK] Stopped test track:', track.label);
      });

      setMicrophoneError(null);
      return true;
    } catch (error) {
      console.error('🎤 [MIC_CHECK] ❌ Microphone access denied or failed:', {
        error,
        errorName: error?.name,
        errorMessage: error?.message
      });

      setMicrophoneError(error.message);
      return false;
    }
  };

  /**
   * Start the conversation
   */
  const handleStartConversation = async () => {
    console.log('🚀 [START] Beginning conversation start sequence...');
    console.log(`   Agent ID: ${ELEVENLABS_AGENT_ID}`);
    console.log(`   Current status: ${conversation.status}`);

    if (!ELEVENLABS_AGENT_ID) {
      console.error('❌ [START] Agent ID is missing');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isStartingSession.current || conversation.status === 'connected' || conversation.status === 'connecting') {
      console.log('⚠️ [START] Session already starting or connected, skipping...');
      console.log(`   isStartingSession: ${isStartingSession.current}`);
      console.log(`   conversation.status: ${conversation.status}`);
      return;
    }

    try {
      // First, check microphone permissions
      console.log('🎤 [START] Step 1: Checking microphone permissions...');
      const hasMicPermission = await checkMicrophonePermissions();

      if (!hasMicPermission) {
        console.error('❌ [START] Cannot start without microphone permission');
        alert('Mikrofon-Zugriff erforderlich! Bitte erlaube den Zugriff auf dein Mikrofon, um das Gespräch zu starten.');
        return;
      }

      isStartingSession.current = true;
      connectionTimestamp.current = Date.now();
      setConversationMessages([]); // Clear previous messages
      setMicrophoneError(null);

      // Start audio recording BEFORE ElevenLabs session to improve chances of microphone access
      console.log('🚀 [START] Step 2: Starting audio recording for analysis...');
      await startAudioRecording();

      console.log('🚀 [START] Step 3: Initiating ElevenLabs session...');
      console.log(`   Timestamp: ${new Date(connectionTimestamp.current).toISOString()}`);

      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        // Pass user data as client tools variables if needed
        clientTools: userData ? {
          user_name: userData.user_name,
          position: userData.position,
          company: userData.company
        } : {}
      });

      console.log('✅ [START] Session start requested successfully');
    } catch (error) {
      console.error('❌ [START] Error starting conversation:', {
        error,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      });
      isStartingSession.current = false;

      // Show error to user
      alert(`Fehler beim Starten des Gesprächs: ${error.message}\n\nBitte überprüfe:\n- Mikrofon-Berechtigung\n- ElevenLabs Agent ID\n- Internetverbindung`);
    }
  };

  /**
   * Handles wizard completion
   */
  const handleWizardComplete = (data) => {
    console.log('📝 [WIZARD] User data collected:', data);
    setUserData(data);
    setShowWizard(false);

    // Store in localStorage for persistence
    localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(data));
  };

  // Check if user data exists in localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('bewerbungstrainer_user_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
        setShowWizard(false);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
  }, []);

  // Expose debug functions to window for testing
  useEffect(() => {
    window.debugGemini = {
      listModels: async () => {
        if (!GEMINI_API_KEY) {
          console.error('❌ GEMINI_API_KEY is not set');
          return;
        }
        try {
          const models = await listAvailableModels(GEMINI_API_KEY);
          console.log('Available Gemini models:', models);
          return models;
        } catch (error) {
          console.error('Error listing models:', error);
        }
      },
      testFeedback: async (transcript = 'Test transcript') => {
        if (!GEMINI_API_KEY) {
          console.error('❌ GEMINI_API_KEY is not set');
          return;
        }
        try {
          const feedback = await generateInterviewFeedback(transcript, GEMINI_API_KEY);
          console.log('Generated feedback:', feedback);
          return feedback;
        } catch (error) {
          console.error('Error generating feedback:', error);
        }
      },
      apiKey: GEMINI_API_KEY ? 'Set ✅' : 'Not set ❌'
    };

    console.log(`
🔧 Debug-Funktionen verfügbar:
  - window.debugGemini.listModels() - Liste verfügbare Gemini-Modelle
  - window.debugGemini.testFeedback() - Teste Feedback-Generierung
  - window.debugGemini.apiKey - Zeige API-Key Status
    `);

    return () => {
      delete window.debugGemini;
    };
  }, [GEMINI_API_KEY]);

  // Show wizard if user hasn't completed it yet
  if (showWizard) {
    return <UserWizard onComplete={handleWizardComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main Content Area */}
          <div className="p-6 space-y-6">
            {/* User Profile Info */}
            {userData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">Dein Profil</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-700 font-medium">Name:</span>
                        <p className="text-green-900">{userData.user_name}</p>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Position:</span>
                        <p className="text-green-900">{userData.position}</p>
                      </div>
                      <div>
                        <span className="text-green-700 font-medium">Unternehmen:</span>
                        <p className="text-green-900">{userData.company}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm('Möchtest du deine Profildaten wirklich ändern? Das aktuelle Gespräch wird beendet.')) {
                        localStorage.removeItem('bewerbungstrainer_user_data');
                        setUserData(null);
                        setShowWizard(true);
                        if (conversation.status === 'connected') {
                          conversation.endSession();
                        }
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    Bearbeiten
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Willkommen zum Bewerbungsgespräch!</p>
                  <p className="text-blue-700">
                    Klicke auf "Gespräch starten", um mit Herrn Müller zu sprechen.
                    Antworte natürlich und ehrlich auf die Fragen.
                    Am Ende erhältst du ein detailliertes Feedback zu deiner Performance.
                  </p>
                </div>
              </div>
            </div>

            {/* ElevenLabs Conversation Interface */}
            <div className="bg-slate-50 rounded-lg p-6 min-h-[400px] border-2 border-slate-200">
              {ELEVENLABS_AGENT_ID ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  {/* Status Display */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border">
                      <div className={`w-3 h-3 rounded-full ${
                        conversation.status === 'connected' ? 'bg-green-500 animate-pulse' :
                        conversation.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        'bg-slate-300'
                      }`} />
                      <span className="text-sm font-medium">
                        {conversation.status === 'connected' ? 'Verbunden' :
                         conversation.status === 'connecting' ? 'Verbinde...' :
                         'Getrennt'}
                      </span>
                    </div>
                  </div>

                  {/* Conversation Controls */}
                  {conversation.status !== 'connected' ? (
                    <div className="text-center space-y-4">
                      <Phone className="w-16 h-16 text-blue-600 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                          Bereit für dein Bewerbungsgespräch?
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Klicke auf "Gespräch starten", um mit Herrn Müller zu sprechen
                        </p>
                        <Button
                          onClick={handleStartConversation}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={conversation.status === 'connecting' || isStartingSession.current}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {conversation.status === 'connecting' ? 'Verbinde...' : 'Gespräch starten'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 w-full">
                      {/* Speaking Indicator */}
                      <div className="flex flex-col items-center">
                        {conversation.isSpeaking && (
                          <div className="mb-4">
                            <div className="flex gap-1 items-end h-12">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 bg-blue-600 rounded-full animate-pulse"
                                  style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                              {conversation.isSpeaking ? 'Herr Müller spricht...' : 'Du bist dran'}
                            </p>
                          </div>
                        )}

                        {/* Microphone Visual */}
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                          conversation.micMuted ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {conversation.micMuted ? (
                            <MicOff className="w-12 h-12 text-red-600" />
                          ) : (
                            <Mic className="w-12 h-12 text-blue-600" />
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-2">
                          {conversation.micMuted ? 'Mikrofon aus' : 'Spreche klar und deutlich'}
                        </p>
                      </div>

                      {/* Message Log */}
                      {conversationMessages.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-2 text-left bg-white p-4 rounded-lg">
                          {conversationMessages.slice(-3).map((msg, idx) => (
                            <div key={idx} className={`text-sm ${
                              msg.source === 'ai' ? 'text-blue-700' : 'text-slate-700'
                            }`}>
                              <span className="font-semibold">
                                {msg.source === 'ai' ? 'Herr Müller' : 'Du'}:
                              </span>{' '}
                              {msg.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* End Call Button */}
                      <Button
                        onClick={handleEndInterview}
                        disabled={isRequestingFeedback}
                        variant="destructive"
                        size="lg"
                      >
                        <PhoneOff className="w-4 h-4 mr-2" />
                        Gespräch beenden & Feedback erhalten
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <StopCircle className="w-16 h-16 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    ElevenLabs Agent ID fehlt
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md">
                    Bitte setze die <code className="bg-slate-200 px-2 py-1 rounded">VITE_ELEVENLABS_AGENT_ID</code>
                    {' '}in der .env Datei, um das Interview zu starten.
                  </p>
                </div>
              )}
            </div>

            {/* Warning if microphone error occurred */}
            {microphoneError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <span className="font-semibold">Mikrofon-Fehler:</span> {microphoneError}
                  <br />
                  <span className="text-xs mt-1 block">
                    Bitte stelle sicher, dass dein Browser Zugriff auf das Mikrofon hat.
                    Überprüfe die Browser-Einstellungen und erlaube den Mikrofonzugriff für diese Seite.
                  </span>
                </p>
              </div>
            )}

            {/* Warning if Gemini API key is missing */}
            {!GEMINI_API_KEY && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Hinweis:</span> Der Gemini API Key ist nicht konfiguriert.
                  Feedback-Funktion ist nicht verfügbar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>Bewerbungstrainer © 2025 | Powered by ElevenLabs & Google Gemini</p>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        feedbackContent={feedbackContent}
        audioAnalysisContent={audioAnalysisContent}
        isLoading={isRequestingFeedback}
      />
    </div>
  );
}

export default App;
