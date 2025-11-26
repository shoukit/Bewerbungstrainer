import React, { useState } from 'react';
import { Button } from './ui/button';
import { User, Briefcase, Building, ChevronRight, ChevronLeft, Loader2, Video, Mic, CheckCircle, Check } from 'lucide-react';
import wordpressAPI from '../services/wordpress-api';

/**
 * VideoTrainingWizard Component
 *
 * 3-step wizard for setting up video interview training:
 * Step 1: Personal information (name, position, company, experience level)
 * Step 2: Generate and review interview questions
 * Step 3: Camera & microphone check
 */
function VideoTrainingWizard({ onComplete }) {
  const isWordPress = wordpressAPI.isWordPress();
  const wpUser = isWordPress ? wordpressAPI.getCurrentUser() : null;
  const isLoggedIn = wpUser?.id && wpUser.id > 0;
  const defaultUserName = isLoggedIn ? (wpUser?.firstName || wpUser?.name || '') : '';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: defaultUserName,
    position: '',
    company: '',
    experience_level: 'professional'
  });
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState({
    video: '',
    audio: ''
  });
  const [availableDevices, setAvailableDevices] = useState({
    video: [],
    audio: []
  });

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Validate current step
   */
  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.position.trim()) {
        newErrors.position = 'Bitte gib die Position ein';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Generate questions using AI
   */
  const generateQuestions = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await wordpressAPI.generateQuestions({
        position: formData.position,
        company: formData.company,
        experience_level: formData.experience_level
      });

      if (response.success && response.data.questions) {
        const generatedQuestions = response.data.questions;
        setQuestions(generatedQuestions);
        setSelectedQuestions(generatedQuestions.map(q => q.id));
        setStep(2);
      } else {
        setErrors({ generate: 'Fehler beim Generieren der Fragen' });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      setErrors({ generate: error.message || 'Fehler beim Generieren der Fragen' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle question selection
   */
  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  /**
   * Initialize camera and microphone
   */
  const initializeDevices = async () => {
    console.log('🎥 Initializing devices...');
    setErrors({}); // Clear any previous errors

    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not available in this browser');
      }

      // IMPORTANT: Request camera access FIRST to get permissions
      // Otherwise enumerateDevices will return empty labels
      console.log('🎥 Requesting camera and microphone access...');
      console.log('⚠️ Please allow camera and microphone access in your browser!');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log('✅ Camera and microphone access granted');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);

      setCameraStream(stream);

      // NOW get available devices (with proper labels)
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('📱 All devices:', devices);

      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const audioDevices = devices.filter(d => d.kind === 'audioinput');

      console.log('📹 Video devices found:', videoDevices.length, videoDevices);
      console.log('🎤 Audio devices found:', audioDevices.length, audioDevices);

      // Check if we actually found devices
      if (videoDevices.length === 0 || audioDevices.length === 0) {
        console.warn('⚠️ Not all devices found - video:', videoDevices.length, 'audio:', audioDevices.length);
      }

      setAvailableDevices({
        video: videoDevices,
        audio: audioDevices
      });

      // Set default devices to currently active ones
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('📹 Active video device:', settings.deviceId);
        setSelectedDevices(prev => ({
          ...prev,
          video: settings.deviceId || (videoDevices[0]?.deviceId || '')
        }));
      }
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('🎤 Active audio device:', settings.deviceId);
        setSelectedDevices(prev => ({
          ...prev,
          audio: settings.deviceId || (audioDevices[0]?.deviceId || '')
        }));
      }

      console.log('✅ Device initialization complete');

    } catch (error) {
      console.error('❌ Error accessing devices:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

      let errorMessage = 'Fehler beim Zugriff auf Kamera oder Mikrofon';
      let showRetry = true;

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Zugriff auf Kamera/Mikrofon wurde verweigert. Bitte klicke auf "Zulassen" im Browser-Dialog und versuche es erneut.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Keine Kamera oder Mikrofon gefunden. Bitte stelle sicher, dass ein Gerät angeschlossen ist und nicht von einer anderen Anwendung verwendet wird.';
      } else if (error.name === 'NotReadableError' || error.name === 'OverconstrainedError') {
        errorMessage = 'Kamera/Mikrofon wird bereits von einer anderen Anwendung verwendet oder ist nicht verfügbar. Bitte schließe andere Apps, die auf die Kamera/Mikrofon zugreifen.';
      } else {
        errorMessage = `Fehler beim Zugriff auf Kamera/Mikrofon: ${error.message}`;
      }

      setErrors({ devices: errorMessage, showRetry });
    }
  };

  /**
   * Handle step navigation
   */
  const handleNext = async () => {
    if (!validateStep(step)) {
      return;
    }

    if (step === 1) {
      await generateQuestions();
    } else if (step === 2) {
      if (selectedQuestions.length === 0) {
        setErrors({ questions: 'Bitte wähle mindestens eine Frage aus' });
        return;
      }
      setStep(3);
      await initializeDevices();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3 && cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }
  };

  /**
   * Start the video training
   */
  const handleStart = () => {
    const selectedQuestionsData = questions.filter(q => selectedQuestions.includes(q.id));

    onComplete({
      ...formData,
      questions: selectedQuestionsData,
      cameraStream,
      selectedDevices
    });
  };

  /**
   * Change device
   */
  const changeDevice = async (type, deviceId) => {
    // Only proceed if deviceId is valid
    if (!deviceId || deviceId === '') {
      console.warn('Invalid deviceId, skipping change');
      return;
    }

    setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());

      const newVideoId = type === 'video' ? deviceId : selectedDevices.video;
      const newAudioId = type === 'audio' ? deviceId : selectedDevices.audio;

      const constraints = {
        video: (newVideoId && newVideoId !== '') ? { deviceId: { exact: newVideoId } } : true,
        audio: (newAudioId && newAudioId !== '') ? { deviceId: { exact: newAudioId } } : true
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraStream(newStream);
      } catch (error) {
        console.error('Error changing device:', error);
        setErrors({ devices: 'Fehler beim Wechseln des Geräts: ' + error.message });
      }
    }
  };

  /**
   * Render video preview
   */
  React.useEffect(() => {
    if (cameraStream && step === 3) {
      const videoElement = document.getElementById('camera-preview');
      if (videoElement) {
        videoElement.srcObject = cameraStream;
      }
    }
  }, [cameraStream, step]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= i ? 'bg-ocean-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i ? <CheckCircle className="w-6 h-6" /> : i}
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > i ? 'bg-ocean-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Persönliche Daten</span>
          <span>Fragen generieren</span>
          <span>Kamera & Mikrofon</span>
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Persönliche Parameter</h2>
          <p className="text-gray-600">Gib deine Informationen ein, um personalisierte Interviewfragen zu generieren.</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Name (optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Dein Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline w-4 h-4 mr-2" />
                Zielposition *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder="z.B. Junior Product Manager"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 ${
                  errors.position ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">{errors.position}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline w-4 h-4 mr-2" />
                Firma / Wunschfirma (optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="z.B. BMW"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Erfahrungslevel
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => handleInputChange('experience_level', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
              >
                <option value="student">Schüler</option>
                <option value="entry">Berufseinsteiger</option>
                <option value="professional">Professional</option>
                <option value="senior">Senior / Führungskraft</option>
              </select>
            </div>
          </div>

          {errors.generate && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.generate}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Fragen werden generiert...</span>
                </>
              ) : (
                <>
                  <span>Fragen generieren</span>
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Deine Interviewfragen</h2>
          <p className="text-gray-600">
            KarriereHeld hat {questions.length} Fragen für dich erstellt. Alle Fragen sind bereits ausgewählt.
            Du kannst Fragen abwählen, wenn du möchtest (mindestens 1 Frage muss ausgewählt bleiben).
          </p>

          <div className="p-4 bg-ocean-50 border border-ocean-200 rounded-lg">
            <p className="text-sm text-ocean-800">
              <strong>{selectedQuestions.length}</strong> von <strong>{questions.length}</strong> Fragen ausgewählt
            </p>
          </div>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedQuestions.includes(q.id)
                    ? 'border-ocean-500 bg-ocean-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => toggleQuestion(q.id)}
              >
                <div className="flex items-start">
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 transition-colors ${
                    selectedQuestions.includes(q.id)
                      ? 'border-ocean-500 bg-ocean-500'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {selectedQuestions.includes(q.id) && (
                      <Check className="w-5 h-5 text-white stroke-[4] font-bold" strokeWidth={4} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {index + 1}. {q.question}
                    </p>
                    {q.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {q.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.questions && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.questions}
            </div>
          )}

          <div className="flex justify-between">
            <Button
              onClick={handleBack}
              variant="outline"
              className="px-6 py-3 flex items-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span>Zurück</span>
            </Button>
            <Button
              onClick={handleNext}
              className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-3 flex items-center"
            >
              <span>Weiter</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Camera & Mic Check */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Kamera & Mikrofon Check</h2>
          <p className="text-gray-600">
            Stelle sicher, dass deine Kamera und dein Mikrofon richtig funktionieren.
            Das gesamte Interview wird in einem durchgehenden Video aufgezeichnet.
          </p>

          {/* Permission notice */}
          {!cameraStream && !errors.devices && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Wichtig:</strong> Bitte erlaube den Zugriff auf Kamera und Mikrofon im Browser-Dialog, wenn dieser erscheint.
              </p>
            </div>
          )}

          {/* Video Preview */}
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              id="camera-preview"
              autoPlay
              playsInline
              muted
              className="w-full aspect-video"
            />
          </div>

          {/* Device Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Video className="inline w-4 h-4 mr-2" />
                Kamera
              </label>
              <select
                value={selectedDevices.video}
                onChange={(e) => changeDevice('video', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500"
              >
                {availableDevices.video.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Kamera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mic className="inline w-4 h-4 mr-2" />
                Mikrofon
              </label>
              <select
                value={selectedDevices.audio}
                onChange={(e) => changeDevice('audio', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500"
              >
                {availableDevices.audio.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Mikrofon ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.devices && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 mb-3">{errors.devices}</p>
              {errors.showRetry && (
                <Button
                  onClick={initializeDevices}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Erneut versuchen
                </Button>
              )}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Das gesamte Interview wird in einem durchgehenden Video aufgezeichnet.
              Du kannst zwischen den Fragen hin- und herspringen.
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handleBack}
              variant="outline"
              className="px-6 py-3 flex items-center"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span>Zurück</span>
            </Button>
            <Button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold flex items-center"
            >
              <Video className="w-5 h-5 mr-2" />
              <span>Aufnahme starten</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoTrainingWizard;
