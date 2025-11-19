import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import Header from './components/Header';
import FeedbackModal from './components/FeedbackModal';
import UserWizard from './components/UserWizard';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/dialog';
import { generateInterviewFeedback, generateAudioAnalysis, listAvailableModels } from './services/gemini';
import wordpressAPI from './services/wordpress-api';
import { MessageSquare, StopCircle, Mic, MicOff, Phone, PhoneOff, Edit3, RotateCcw, Play, AlertCircle, TrendingUp, History, Settings } from 'lucide-react';

console.log('📦 [APP] App.jsx module loaded');
console.log('📦 [APP] Imports loaded:', {
  React: typeof React,
  useConversation: typeof useConversation,
  Header: typeof Header,
  FeedbackModal: typeof FeedbackModal,
  UserWizard: typeof UserWizard,
  Button: typeof Button,
  Dialog: typeof Dialog,
  DialogContent: typeof DialogContent,
});

function App() {
  console.log('🏗️ [APP] App component function called - starting render');
  console.log('🏗️ [APP] Timestamp:', new Date().toISOString());
  console.log('🔧 [APP] Initializing state hooks...');
  const [showWizard, setShowWizard] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [microphoneError, setMicrophoneError] = useState(null);
  const [audioAnalysisContent, setAudioAnalysisContent] = useState('');
  const [audioRecordingError, setAudioRecordingError] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);

  // WordPress integration
  const [currentSession, setCurrentSession] = useState(null);
  const [isWordPress, setIsWordPress] = useState(false);

  console.log('🔧 [APP] State hooks initialized:', {
    showWizard,
    userData,
    showFeedbackModal,
    showSettingsDialog,
    conversationCount
  });

  // Track if we're currently starting a session to prevent double-starts
  const isStartingSession = useRef(false);
  const connectionTimestamp = useRef(null);

  // Store the ElevenLabs conversation ID for audio download
  const conversationIdRef = useRef(null);

  // Environment variables (support both Vite and WordPress)
  console.log('🔧 [APP] Getting API keys from wordpressAPI...');
  const ELEVENLABS_AGENT_ID = wordpressAPI.getElevenLabsAgentId();
  const GEMINI_API_KEY = wordpressAPI.getGeminiApiKey();
  const ELEVENLABS_API_KEY = wordpressAPI.getElevenLabsApiKey();
  console.log('🔧 [APP] API keys loaded:', {
    ELEVENLABS_AGENT_ID: ELEVENLABS_AGENT_ID ? `${ELEVENLABS_AGENT_ID.substring(0, 8)}...` : 'NOT SET',
    GEMINI_API_KEY: GEMINI_API_KEY ? 'SET' : 'NOT SET',
    ELEVENLABS_API_KEY: ELEVENLABS_API_KEY ? 'SET' : 'NOT SET'
  });

  // ElevenLabs Conversation Hook with extensive logging
  console.log('🔧 [APP] Initializing useConversation hook...');
  const conversation = useConversation({
    overrides: {
      agent: {
        language: "de", // German language
        // Note: firstMessage is configured in the ElevenLabs agent settings and cannot be overridden
      },
    },
    onConnect: () => {
      const now = Date.now();
      const timeSinceStart = connectionTimestamp.current ? now - connectionTimestamp.current : 0;
      console.log('🟢 [CONNECTED] ElevenLabs WebSocket connected');
      console.log(`   Time since start: ${timeSinceStart}ms`);
      isStartingSession.current = false;
    },
    onDisconnect: (event) => {
      const now = Date.now();
      const timeSinceStart = connectionTimestamp.current ? now - connectionTimestamp.current : 0;
      console.log('🔴 [DISCONNECTED] ElevenLabs WebSocket disconnected');
      console.log(`   Time since start: ${timeSinceStart}ms`);
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
        timestamp: new Date().toISOString()
      });
      isStartingSession.current = false;
      setMicrophoneError(error?.message || 'Unknown error occurred');
    },
    onModeChange: (mode) => {
      console.log('🔄 [MODE_CHANGE] New mode:', mode);
    },
  });

  console.log('🔧 [APP] useConversation hook initialized:', {
    conversation: typeof conversation,
    status: conversation?.status,
    isSpeaking: conversation?.isSpeaking,
    micMuted: conversation?.micMuted,
    startSession: typeof conversation?.startSession,
    endSession: typeof conversation?.endSession
  });

  /**
   * Downloads the conversation audio from ElevenLabs with retry logic
   * @param {string} conversationId - The ElevenLabs conversation ID
   * @param {number} maxRetries - Maximum number of retry attempts (default: 5)
   * @param {number} initialDelay - Initial delay in ms before first retry (default: 2000)
   * @returns {Promise<Blob|null>} - The audio blob or null if failed
   */
  const downloadConversationAudio = async (conversationId, maxRetries = 5, initialDelay = 2000) => {
    console.log('📥 [AUDIO DOWNLOAD] Downloading conversation audio from ElevenLabs...');
    console.log(`📥 [AUDIO DOWNLOAD] Conversation ID: ${conversationId}`);
    console.log(`📥 [AUDIO DOWNLOAD] Max retries: ${maxRetries}, Initial delay: ${initialDelay}ms`);

    if (!ELEVENLABS_API_KEY) {
      console.error('❌ [AUDIO DOWNLOAD] ElevenLabs API key is missing');
      const errorMsg = 'ElevenLabs API key ist nicht konfiguriert.';
      setAudioRecordingError(errorMsg);
      return null;
    }

    // ElevenLabs API endpoint for conversation audio
    const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`;

    // Retry with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait before attempting (skip wait on first attempt)
        if (attempt > 0) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          console.log(`⏳ [AUDIO DOWNLOAD] Waiting ${delay}ms before retry attempt ${attempt}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log(`📥 [AUDIO DOWNLOAD] Attempt ${attempt + 1}/${maxRetries + 1}: Fetching audio from API...`);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        });

        if (response.ok) {
          // Success! Get the audio blob
          const audioBlob = await response.blob();
          console.log(`✅ [AUDIO DOWNLOAD] Audio downloaded successfully on attempt ${attempt + 1}: ${audioBlob.size} bytes`);
          setAudioRecordingError(null); // Clear any previous errors
          return audioBlob;
        }

        // Handle specific error cases
        const errorText = await response.text();
        console.warn(`⚠️ [AUDIO DOWNLOAD] Attempt ${attempt + 1} failed with status ${response.status}:`, errorText);

        // Parse error response if it's JSON
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail?.message || errorJson.message || errorText;
        } catch (e) {
          // Not JSON, use raw error text
        }

        // If we get a 404 with "missing_conversation_audio", it means the audio is still being processed
        // We should retry in this case
        if (response.status === 404 && errorText.includes('missing_conversation_audio')) {
          console.log(`⏳ [AUDIO DOWNLOAD] Audio not ready yet (still processing). Will retry...`);

          // If this is the last attempt, throw an error
          if (attempt === maxRetries) {
            const finalError = 'Das Gesprächsaudio ist noch nicht verfügbar. Möglicherweise ist die Aufzeichnung in den Agent-Einstellungen nicht aktiviert, oder die Verarbeitung dauert länger als erwartet.';
            setAudioRecordingError(finalError);
            console.error(`❌ [AUDIO DOWNLOAD] Max retries reached. Audio still not available.`);
            return null;
          }

          continue; // Retry
        }

        // For other errors, throw immediately
        throw new Error(`API-Fehler (${response.status}): ${errorDetail}`);

      } catch (error) {
        console.error(`❌ [AUDIO DOWNLOAD] Error on attempt ${attempt + 1}:`, error);

        // If this is the last attempt, give up
        if (attempt === maxRetries) {
          const errorMsg = `Audio-Download fehlgeschlagen nach ${maxRetries + 1} Versuchen: ${error.message}`;
          setAudioRecordingError(errorMsg);
          return null;
        }

        // For network errors, retry
        if (error.message.includes('fetch') || error.message.includes('network')) {
          console.log(`⏳ [AUDIO DOWNLOAD] Network error, will retry...`);
          continue;
        }

        // For other errors, throw immediately
        setAudioRecordingError(`Audio-Download fehlgeschlagen: ${error.message}`);
        return null;
      }
    }

    // Should never reach here, but just in case
    console.error('❌ [AUDIO DOWNLOAD] Unexpected end of retry loop');
    return null;
  };

  /**
   * Handles the end of interview and generates feedback
   */
  const handleEndInterview = async () => {
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

      // Generate text feedback
      const feedbackPromise = generateInterviewFeedback(transcript, GEMINI_API_KEY);

      // Download and analyze conversation audio from ElevenLabs
      let audioAnalysisPromise = Promise.resolve(null);

      if (conversationIdRef.current) {
        console.log('📥 [FEEDBACK] Preparing to download conversation audio from ElevenLabs...');
        console.log(`📥 [FEEDBACK] Conversation ID: ${conversationIdRef.current}`);
        console.log('⏳ [FEEDBACK] Waiting for audio to be processed by ElevenLabs...');

        audioAnalysisPromise = (async () => {
          // Wait a bit before attempting download to give ElevenLabs time to process
          // The audio file needs to be processed and stored after the conversation ends
          const initialWait = 3000; // 3 seconds initial wait
          console.log(`⏳ [FEEDBACK] Waiting ${initialWait}ms for audio processing...`);
          await new Promise(resolve => setTimeout(resolve, initialWait));

          // Now attempt to download with retries
          const audioBlob = await downloadConversationAudio(conversationIdRef.current);

          if (audioBlob && audioBlob.size > 0) {
            console.log('🎙️ [FEEDBACK] Analyzing conversation audio...');
            console.log(`🎙️ [FEEDBACK] Audio blob size: ${audioBlob.size} bytes`);
            return generateAudioAnalysis(audioBlob, GEMINI_API_KEY);
          } else {
            console.warn('⚠️ [FEEDBACK] No audio downloaded, skipping analysis');
            return JSON.stringify({
              summary: 'Audio-Analyse nicht verfügbar: Das Gespräch konnte nicht heruntergeladen werden.',
              error: true,
              errorMessage: 'Audio-Download fehlgeschlagen - möglicherweise ist die Aufzeichnung im Agent nicht aktiviert.'
            });
          }
        })().catch(error => {
          console.error('❌ [FEEDBACK] Audio analysis failed:', error);
          return JSON.stringify({
            summary: "Die Audio-Analyse konnte leider nicht durchgeführt werden.",
            error: true,
            errorMessage: error.message
          });
        });
      } else {
        console.warn('⚠️ [FEEDBACK] No conversation ID available, skipping audio analysis');
        audioAnalysisPromise = Promise.resolve(JSON.stringify({
          summary: 'Audio-Analyse nicht verfügbar: Keine Gesprächs-ID gefunden.',
          error: true,
          errorMessage: 'Keine Gesprächs-ID vorhanden'
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

      // Save to WordPress database if in WordPress mode
      if (isWordPress && currentSession) {
        try {
          console.log('💾 [WORDPRESS] Saving session data to database...');

          // Update session with transcript, feedback, and audio analysis
          await wordpressAPI.updateSession(currentSession.id, {
            transcript: transcript,
            feedback_json: feedback,
            audio_analysis_json: audioAnalysis
          });

          // Save audio from ElevenLabs if we have a conversation ID
          if (conversationIdRef.current) {
            console.log('🎵 [WORDPRESS] Saving audio from ElevenLabs...');
            try {
              await wordpressAPI.saveAudioFromElevenLabs(
                conversationIdRef.current,
                currentSession.id
              );
              console.log('✅ [WORDPRESS] Audio saved successfully');
            } catch (audioError) {
              console.error('❌ [WORDPRESS] Failed to save audio:', audioError);
              // Don't fail the whole process if audio save fails
            }
          }

          console.log('✅ [WORDPRESS] Session data saved successfully');
        } catch (wpError) {
          console.error('❌ [WORDPRESS] Failed to save session:', wpError);
          // Don't fail the feedback display if WordPress save fails
        }
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
      setAudioRecordingError(null);
      conversationIdRef.current = null; // Clear previous conversation ID

      console.log('🚀 [START] Step 2: Initiating ElevenLabs session...');
      console.log(`   Timestamp: ${new Date(connectionTimestamp.current).toISOString()}`);

      // Start the conversation and capture the conversation ID
      const conversationId = await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        // Pass user data as client tools variables if needed
        clientTools: userData ? {
          user_name: userData.user_name,
          position: userData.position,
          company: userData.company
        } : {}
      });

      // Store the conversation ID for later audio download
      conversationIdRef.current = conversationId;
      console.log('✅ [START] Session started successfully');
      console.log(`✅ [START] Conversation ID: ${conversationId}`);

      // Create WordPress session if in WordPress mode (even for non-logged-in users)
      if (isWordPress && userData) {
        try {
          console.log('💾 [WORDPRESS] Creating session in database...');
          const response = await wordpressAPI.createSession({
            user_name: userData.user_name, // Include user_name for non-logged-in users
            position: userData.position,
            company: userData.company,
            conversation_id: conversationId
          });

          if (response.success && response.data) {
            setCurrentSession(response.data);
            console.log('✅ [WORDPRESS] Session created:', response.data.id);
          }
        } catch (wpError) {
          console.error('❌ [WORDPRESS] Failed to create session:', wpError);
          // Continue even if WordPress save fails
        }
      }

      // Increment conversation count
      setConversationCount(prev => prev + 1);
      if (!isWordPress) {
        localStorage.setItem('bewerbungstrainer_conversation_count', String(conversationCount + 1));
      }
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
  const handleWizardComplete = useCallback((data) => {
    console.log('📝 [WIZARD] handleWizardComplete called');
    console.log('📝 [WIZARD] User data collected:', data);
    console.log('📝 [WIZARD] typeof data:', typeof data);
    setUserData(data);
    setShowWizard(false);

    // Store in localStorage for persistence (only if not in WordPress)
    if (!isWordPress) {
      localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(data));
    }
    console.log('📝 [WIZARD] handleWizardComplete completed');
  }, [isWordPress]);

  /**
   * Handle starting a new conversation - ask user if they want to keep or change data
   */
  const handleNewConversation = useCallback(() => {
    console.log('🆕 [APP] handleNewConversation called');
    console.log('🆕 [APP] userData:', userData);
    console.log('🆕 [APP] conversationCount:', conversationCount);
    if (userData && conversationCount > 0) {
      console.log('🆕 [APP] Showing settings dialog');
      setShowSettingsDialog(true);
    } else {
      // First conversation, just start
      console.log('🆕 [APP] Starting first conversation');
      handleStartConversation();
    }
  }, [userData, conversationCount]);

  /**
   * Handle keeping existing data and starting conversation
   */
  const handleKeepDataAndStart = useCallback(() => {
    console.log('✅ [APP] handleKeepDataAndStart called');
    setShowSettingsDialog(false);
    handleStartConversation();
  }, []);

  /**
   * Handle changing data - show wizard again
   */
  const handleChangeData = useCallback(() => {
    console.log('✏️ [APP] handleChangeData called');
    setShowSettingsDialog(false);
    setShowWizard(true);
  }, []);

  // Callback for settings dialog onOpenChange
  const handleSettingsDialogOpenChange = useCallback((open) => {
    console.log('⚙️ [APP] handleSettingsDialogOpenChange called with:', open);
    console.log('⚙️ [APP] typeof open:', typeof open);
    console.log('⚙️ [APP] setShowSettingsDialog:', typeof setShowSettingsDialog);
    setShowSettingsDialog(open);
  }, []);

  // Callback for feedback modal close
  const handleFeedbackModalClose = useCallback(() => {
    console.log('📝 [APP] handleFeedbackModalClose called');
    setShowFeedbackModal(false);
  }, []);

  // Initialize WordPress integration and load user data on mount
  useEffect(() => {
    // Check if running in WordPress
    const wpMode = wordpressAPI.isWordPress();
    setIsWordPress(wpMode);
    console.log(`🔧 [INIT] WordPress mode: ${wpMode}`);

    if (wpMode) {
      // Load WordPress user data
      const wpUser = wordpressAPI.getCurrentUser();
      const isLoggedIn = wpUser?.id && wpUser.id > 0;
      console.log('👤 [WORDPRESS] Current user:', wpUser);
      console.log('👤 [WORDPRESS] Is logged in:', isLoggedIn);

      // Always show wizard - it will skip name step for logged-in users with name
      setShowWizard(true);

      // Load session count from WordPress (only for logged-in users)
      if (isLoggedIn) {
        wordpressAPI.getSessions({ limit: 1 })
          .then(response => {
            if (response.success && response.pagination) {
              setConversationCount(response.pagination.total);
            }
          })
          .catch(error => {
            console.error('❌ [WORDPRESS] Failed to load session count:', error);
          });
      }

    } else {
      // Standalone mode - use localStorage
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

      // Load conversation count
      const storedCount = localStorage.getItem('bewerbungstrainer_conversation_count');
      if (storedCount) {
        setConversationCount(parseInt(storedCount, 10));
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
    console.log('🧙 [APP] Rendering UserWizard');
    console.log('🧙 [APP] handleWizardComplete type:', typeof handleWizardComplete);
    return <UserWizard onComplete={handleWizardComplete} />;
  }

  console.log('🎨 [APP] Starting main render...');
  console.log('🎨 [APP] State at render time:', {
    showWizard,
    userData: userData ? 'SET' : 'NULL',
    showFeedbackModal,
    showSettingsDialog,
    conversationCount,
    conversationStatus: conversation?.status
  });
  console.log('🎨 [APP] Callback functions:', {
    handleSettingsDialogOpenChange: typeof handleSettingsDialogOpenChange,
    handleFeedbackModalClose: typeof handleFeedbackModalClose,
    handleKeepDataAndStart: typeof handleKeepDataAndStart,
    handleChangeData: typeof handleChangeData
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-blue-100 via-ocean-blue-200 to-ocean-blue-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-ocean-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-ocean-deep-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-ocean-teal-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          {/* Header */}
          <Header userName={userData?.user_name} position={userData?.position} company={userData?.company} />

          {/* Main Content Area */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Stats and Quick Actions Row */}
            {userData && conversationCount > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-ocean-blue-50 to-ocean-blue-100 rounded-2xl p-4 border border-ocean-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 flex items-center justify-center">
                      <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-ocean-deep-600">Gespräche</p>
                      <p className="text-2xl font-bold text-ocean-deep-800">{conversationCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-ocean-teal-50 to-ocean-teal-100 rounded-2xl p-4 border border-ocean-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-ocean-deep-600">Fortschritt</p>
                      <p className="text-2xl font-bold text-ocean-deep-800">
                        {conversationCount > 0 ? Math.min(conversationCount * 15, 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-ocean-blue-50 to-ocean-teal-50 rounded-2xl p-4 border border-ocean-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-deep-500 to-ocean-deep-600 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Button
                        onClick={() => {
                          if (confirm('Möchtest du deine Profildaten wirklich ändern?')) {
                            if (!isWordPress) {
                              localStorage.removeItem('bewerbungstrainer_user_data');
                            }
                            setUserData(null);
                            setShowWizard(true);
                            if (conversation.status === 'connected') {
                              conversation.endSession();
                            }
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Profil ändern
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-ocean-blue-200/60">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-50 via-ocean-blue-100 to-ocean-teal-50"></div>
              <div className="relative p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ocean-deep-800 mb-2 text-lg">So funktioniert's</p>
                  <ul className="space-y-2 text-sm text-ocean-deep-700">
                    <li className="flex items-start gap-2">
                      <span className="text-ocean-blue-600 font-bold mt-0.5">1.</span>
                      <span>Klicke auf "Gespräch starten" und führe ein realistisches Bewerbungsgespräch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ocean-deep-600 font-bold mt-0.5">2.</span>
                      <span>Antworte natürlich und ehrlich auf alle Fragen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-ocean-teal-600 font-bold mt-0.5">3.</span>
                      <span>Erhalte detailliertes KI-Feedback zu deiner Performance und Sprechweise</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ElevenLabs Conversation Interface */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-blue-50 to-ocean-deep-100/30 p-8 min-h-[450px] border-2 border-ocean-blue-200/60">
              {ELEVENLABS_AGENT_ID ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  {/* Status Display */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60">
                      <div className={`w-4 h-4 rounded-full ${
                        conversation.status === 'connected' ? 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse shadow-lg shadow-green-400/50' :
                        conversation.status === 'connecting' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse shadow-lg shadow-yellow-400/50' :
                        'bg-slate-300'
                      }`} />
                      <span className="text-sm font-semibold">
                        {conversation.status === 'connected' ? '🟢 Verbunden' :
                         conversation.status === 'connecting' ? '🟡 Verbinde...' :
                         '⚪ Bereit'}
                      </span>
                    </div>
                  </div>

                  {/* Conversation Controls */}
                  {conversation.status !== 'connected' ? (
                    <div className="text-center space-y-6">
                      <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 flex items-center justify-center shadow-2xl">
                          <Phone className="w-12 h-12 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-ocean-teal-400 to-ocean-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-ocean-deep-800 mb-2">
                          Bereit für dein Interview?
                        </h3>
                        <p className="text-sm text-ocean-deep-600 mb-6 max-w-md mx-auto">
                          Starte jetzt dein Bewerbungsgespräch mit Herrn Müller und erhalte professionelles Feedback
                        </p>
                        <Button
                          onClick={conversationCount > 0 ? handleNewConversation : handleStartConversation}
                          size="lg"
                          className="bg-gradient-to-r from-ocean-blue-600 via-ocean-deep-600 to-ocean-teal-500 hover:from-ocean-blue-700 hover:via-ocean-deep-700 hover:to-ocean-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-base px-8 py-6"
                          disabled={conversation.status === 'connecting' || isStartingSession.current}
                        >
                          <Phone className="w-5 h-5 mr-2" />
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
                            <div className="flex gap-2 items-end h-16 mb-3">
                              {[...Array(7)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-3 bg-gradient-to-t from-ocean-blue-500 to-ocean-deep-600 rounded-full animate-pulse shadow-lg"
                                  style={{
                                    height: `${Math.random() * 100}%`,
                                    animationDelay: `${i * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-ocean-deep-700 font-medium">
                              {conversation.isSpeaking ? '🗣️ Herr Müller spricht...' : '👂 Du bist dran'}
                            </p>
                          </div>
                        )}

                        {/* Microphone Visual */}
                        <div className="relative group">
                          <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-2xl ${
                            conversation.micMuted
                              ? 'bg-gradient-to-br from-red-400 to-pink-500'
                              : 'bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 animate-pulse'
                          }`}>
                            {conversation.micMuted ? (
                              <MicOff className="w-14 h-14 text-white" strokeWidth={2} />
                            ) : (
                              <Mic className="w-14 h-14 text-white" strokeWidth={2} />
                            )}
                          </div>
                          <div className={`absolute -inset-2 rounded-3xl blur-xl opacity-50 ${
                            conversation.micMuted ? 'bg-red-400' : 'bg-ocean-deep-500'
                          }`}></div>
                        </div>

                        <p className={`text-sm font-medium mt-3 px-4 py-2 rounded-full ${
                          conversation.micMuted
                            ? 'bg-red-100 text-red-700'
                            : 'bg-ocean-blue-100 text-ocean-blue-700'
                        }`}>
                          {conversation.micMuted ? '🔇 Mikrofon aus' : '🎤 Spreche klar und deutlich'}
                        </p>
                      </div>

                      {/* End Call Button */}
                      <Button
                        onClick={handleEndInterview}
                        disabled={isRequestingFeedback}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-base"
                        size="lg"
                      >
                        <PhoneOff className="w-5 h-5 mr-2" />
                        Gespräch beenden & Feedback erhalten
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-4 shadow-xl">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Konfiguration fehlt
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md">
                    Bitte setze die <code className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-mono text-xs">VITE_ELEVENLABS_AGENT_ID</code>
                    {' '}in der .env Datei, um das Interview zu starten.
                  </p>
                </div>
              )}
            </div>

            {/* Warning if microphone error occurred */}
            {microphoneError && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-red-200/60">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50"></div>
                <div className="relative p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 mb-1">Mikrofon-Fehler</p>
                    <p className="text-sm text-red-800 mb-2">{microphoneError}</p>
                    <p className="text-xs text-red-700">
                      💡 Bitte stelle sicher, dass dein Browser Zugriff auf das Mikrofon hat.
                      Überprüfe die Browser-Einstellungen und erlaube den Mikrofonzugriff für diese Seite.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if audio recording error occurred */}
            {audioRecordingError && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-200/60">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
                <div className="relative p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900 mb-1">Audio-Aufzeichnung</p>
                    <p className="text-sm text-yellow-800 mb-2">{audioRecordingError}</p>
                    <p className="text-xs text-yellow-700">
                      💡 Hinweise zur Fehlerbehebung:
                      <br />
                      • Überprüfe, ob "Conversation Recording" in den ElevenLabs Agent-Einstellungen aktiviert ist
                      <br />
                      • Stelle sicher, dass der VITE_ELEVENLABS_API_KEY in der .env Datei gesetzt ist
                      <br />
                      • Die Audio-Verarbeitung kann einige Sekunden nach dem Gespräch dauern
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if ElevenLabs API key is missing */}
            {!import.meta.env.VITE_ELEVENLABS_API_KEY && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-200/60">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
                <div className="relative p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900 mb-1">Hinweis: Audio-Analyse</p>
                    <p className="text-sm text-yellow-800 mb-2">
                      Der ElevenLabs API Key ist nicht konfiguriert. Audio-Analyse-Funktion ist nicht verfügbar.
                    </p>
                    <p className="text-xs text-yellow-700">
                      💡 Um die Audio-Analyse zu aktivieren:
                      <br />
                      1. Setze <code className="bg-yellow-100 px-1 rounded">VITE_ELEVENLABS_API_KEY</code> in der .env Datei
                      <br />
                      2. Stelle sicher, dass "Conversation Recording" in den ElevenLabs Agent-Einstellungen aktiviert ist
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if Gemini API key is missing */}
            {!GEMINI_API_KEY && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-200/60">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50"></div>
                <div className="relative p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900 mb-1">Hinweis</p>
                    <p className="text-sm text-yellow-800">
                      Der Gemini API Key ist nicht konfiguriert. Feedback-Funktion ist nicht verfügbar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-white/60 shadow-sm">
            <p className="text-sm text-ocean-deep-600">
              <span className="font-semibold bg-gradient-to-r from-ocean-blue-600 to-ocean-deep-600 bg-clip-text text-transparent">
                Dein Bewerbungstrainer
              </span>
              {' '}© 2025 | Powered by ElevenLabs & Google Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Settings Dialog - Ask user if they want to keep or change parameters */}
      <Dialog open={showSettingsDialog} onOpenChange={handleSettingsDialogOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-blue-500 to-ocean-deep-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              Neues Gespräch starten
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Möchtest du die gleichen Daten verwenden oder neue eingeben?
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            {/* Current data display */}
            <div className="relative overflow-hidden rounded-2xl border-2">
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-blue-50 via-ocean-blue-100 to-ocean-teal-50"></div>
              <div className="relative p-4">
                <p className="text-sm font-semibold text-ocean-deep-700 mb-3">Aktuelle Daten:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ocean-deep-600">Name:</span>
                    <span className="font-medium text-ocean-deep-800">{userData?.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ocean-deep-600">Position:</span>
                    <span className="font-medium text-ocean-deep-800">{userData?.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ocean-deep-600">Unternehmen:</span>
                    <span className="font-medium text-ocean-deep-800">{userData?.company}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              onClick={handleChangeData}
              variant="outline"
              className="flex-1 border-2 border-ocean-blue-200 hover:border-ocean-blue-400 hover:bg-ocean-blue-50"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Daten ändern
            </Button>
            <Button
              onClick={handleKeepDataAndStart}
              className="flex-1 bg-gradient-to-r from-ocean-blue-600 via-ocean-deep-600 to-ocean-teal-500 hover:from-ocean-blue-700 hover:via-ocean-deep-700 hover:to-ocean-teal-600 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Gleiche Daten verwenden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleFeedbackModalClose}
        feedbackContent={feedbackContent}
        audioAnalysisContent={audioAnalysisContent}
        isLoading={isRequestingFeedback}
      />
    </div>
  );
}

export default App;
