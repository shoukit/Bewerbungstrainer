import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import Header from './components/Header';
import FeedbackModal from './components/FeedbackModal';
import { Button } from './components/ui/button';
import { generateInterviewFeedback } from './services/gemini';
import { MessageSquare, StopCircle, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

function App() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false);
  const [conversationMessages, setConversationMessages] = useState([]);

  // Track if we're currently starting a session to prevent double-starts
  const isStartingSession = useRef(false);
  const hasCleanedUp = useRef(false);

  // Environment variables
  const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs conversation');
      isStartingSession.current = false;
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs conversation');
      isStartingSession.current = false;
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      // Store messages for transcript
      setConversationMessages(prev => [...prev, message]);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      isStartingSession.current = false;
    },
  });

  // Cleanup on unmount to prevent WebSocket issues with React StrictMode
  useEffect(() => {
    return () => {
      // Only cleanup once to avoid double-cleanup in StrictMode
      if (!hasCleanedUp.current && conversation.status === 'connected') {
        hasCleanedUp.current = true;
        conversation.endSession().catch(err => {
          console.error('Error ending session on cleanup:', err);
        });
      }
    };
  }, [conversation]);

  /**
   * Handles the end of interview and generates feedback
   */
  const handleEndInterview = async () => {
    // End the conversation first
    if (conversation.status === 'connected') {
      await conversation.endSession();
    }

    setIsRequestingFeedback(true);
    setShowFeedbackModal(true);
    setFeedbackContent(''); // Clear previous feedback

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

      // Generate feedback using Gemini
      const feedback = await generateInterviewFeedback(transcript, GEMINI_API_KEY);
      setFeedbackContent(feedback);
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
   * Start the conversation
   */
  const handleStartConversation = async () => {
    if (!ELEVENLABS_AGENT_ID) {
      console.error('Agent ID is missing');
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isStartingSession.current || conversation.status === 'connected' || conversation.status === 'connecting') {
      console.log('Session already starting or connected, skipping...');
      return;
    }

    try {
      isStartingSession.current = true;
      hasCleanedUp.current = false; // Reset cleanup flag
      setConversationMessages([]); // Clear previous messages

      console.log('Starting conversation with agent ID:', ELEVENLABS_AGENT_ID);
      await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID });
    } catch (error) {
      console.error('Error starting conversation:', error);
      isStartingSession.current = false;

      // Show error to user
      alert('Fehler beim Starten des Gesprächs. Bitte überprüfe deine ElevenLabs Agent ID und versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main Content Area */}
          <div className="p-6 space-y-6">
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
        isLoading={isRequestingFeedback}
      />
    </div>
  );
}

export default App;
