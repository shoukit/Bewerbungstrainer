import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Compass } from 'lucide-react';
import IkigaiDashboard from './IkigaiDashboard';
import IkigaiCompass from './IkigaiCompass';
import IkigaiResults from './IkigaiResults';
import wordpressAPI from '@/services/wordpress-api';
import FeatureAppHeader from '@/components/global/FeatureAppHeader';
import { COLORS, createGradient } from '@/config/colors';
import { DIMENSIONS } from '@/config/ikigaiDimensions';
import { useScrollToTop } from '@/hooks';
import MicrophoneTestDialog from '@/components/device-setup/MicrophoneTestDialog';

// localStorage key for microphone persistence (shared across modules)
const MICROPHONE_STORAGE_KEY = 'karriereheld_selected_microphone';

/**
 * View states for the Ikigai flow
 */
const VIEWS = {
  DASHBOARD: 'dashboard',
  COMPASS: 'compass',
  RESULTS: 'results',
};

/**
 * IkigaiApp - Main Component
 *
 * "Der Ikigai-Kompass" - Career Pathfinder
 *
 * Coordinates the flow:
 * 1. Dashboard with feature info and session list (public)
 * 2. User clicks on circles to fill each dimension (requires auth)
 * 3. AI extracts keywords from their responses
 * 4. When all 4 dimensions are filled, synthesize career paths
 * 5. Show results with training recommendations
 */
const IkigaiApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [savedIkigaiId, setSavedIkigaiId] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Microphone state - managed at app level, persisted to localStorage
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(() => {
    // Load from localStorage on mount (like SimulatorSession)
    try {
      return localStorage.getItem(MICROPHONE_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [showMicrophoneTest, setShowMicrophoneTest] = useState(false);

  // Save microphone selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedMicrophoneId) {
      try {
        localStorage.setItem(MICROPHONE_STORAGE_KEY, selectedMicrophoneId);
        console.log('[Ikigai] Microphone saved to localStorage:', selectedMicrophoneId);
      } catch {
        // localStorage might be unavailable
      }
    }
  }, [selectedMicrophoneId]);

  // Ikigai feature gradient (purple)
  const ikigaiGradient = createGradient(COLORS.purple[500], COLORS.purple[400]);

  // State for each dimension
  const [dimensions, setDimensions] = useState({
    love: { input: '', tags: [] },
    talent: { input: '', tags: [] },
    need: { input: '', tags: [] },
    market: { input: '', tags: [] },
  });

  // Synthesis result
  const [synthesisResult, setSynthesisResult] = useState(null);

  // Track if session was saved
  const sessionSavedRef = useRef(false);

  // Scroll to top hook
  useScrollToTop({ dependencies: [currentView] });

  // Check if all dimensions have tags
  const allDimensionsFilled = Object.values(dimensions).every(
    (dim) => dim.tags && dim.tags.length > 0
  );

  /**
   * Handle start new Ikigai from dashboard
   */
  const handleStartNew = useCallback(() => {
    // Reset all state
    setDimensions({
      love: { input: '', tags: [] },
      talent: { input: '', tags: [] },
      need: { input: '', tags: [] },
      market: { input: '', tags: [] },
    });
    setSynthesisResult(null);
    setSavedIkigaiId(null);
    sessionSavedRef.current = false;
    setCurrentView(VIEWS.COMPASS);
  }, []);

  /**
   * Handle continue existing session from dashboard
   */
  const handleContinueSession = useCallback(async (session) => {
    try {
      // Load session data
      setSavedIkigaiId(session.id);
      sessionSavedRef.current = true;

      // Set dimensions from session
      setDimensions({
        love: {
          input: session.love_input || '',
          tags: session.love_tags || [],
        },
        talent: {
          input: session.talent_input || '',
          tags: session.talent_tags || [],
        },
        need: {
          input: session.need_input || '',
          tags: session.need_tags || [],
        },
        market: {
          input: session.market_input || '',
          tags: session.market_tags || [],
        },
      });

      // If session has synthesis result, show results
      if (session.status === 'completed' && session.paths) {
        setSynthesisResult({
          summary: session.summary,
          paths: session.paths,
        });
        setCurrentView(VIEWS.RESULTS);
      } else {
        // Otherwise go to compass
        setCurrentView(VIEWS.COMPASS);
      }
    } catch (err) {
      console.error('[Ikigai] Failed to load session:', err);
    }
  }, []);

  /**
   * Handle back to dashboard
   */
  const handleBackToDashboard = useCallback(() => {
    setCurrentView(VIEWS.DASHBOARD);
  }, []);

  /**
   * Create or get current ikigai session
   */
  const ensureSession = useCallback(async () => {
    if (savedIkigaiId) return savedIkigaiId;

    try {
      const response = await wordpressAPI.createIkigai();
      if (response?.id) {
        setSavedIkigaiId(response.id);
        sessionSavedRef.current = true;
        console.log('[Ikigai] Session created with ID:', response.id);
        return response.id;
      }
    } catch (err) {
      console.error('[Ikigai] Failed to create session:', err);
    }
    return null;
  }, [savedIkigaiId]);

  /**
   * Update dimension data (input and tags)
   */
  const updateDimension = useCallback(async (dimensionKey, input, tags) => {
    setDimensions((prev) => ({
      ...prev,
      [dimensionKey]: { input, tags },
    }));

    // Save to backend
    try {
      const sessionId = await ensureSession();
      if (sessionId) {
        await wordpressAPI.updateIkigai(sessionId, {
          [`${dimensionKey}_input`]: input,
          [`${dimensionKey}_tags`]: tags,
        });
        console.log(`[Ikigai] Dimension ${dimensionKey} saved`);
      }
    } catch (err) {
      console.error('[Ikigai] Failed to save dimension:', err);
    }
  }, [ensureSession]);

  /**
   * Extract keywords from user input using AI
   */
  const extractKeywords = useCallback(async (dimensionKey, userInput) => {
    try {
      const response = await wordpressAPI.extractIkigaiKeywords(dimensionKey, userInput);
      if (response?.keywords) {
        return response.keywords;
      }
      return [];
    } catch (err) {
      console.error('[Ikigai] Failed to extract keywords:', err);
      return [];
    }
  }, []);

  /**
   * Synthesize career paths from all dimensions
   */
  const handleSynthesize = useCallback(async () => {
    if (!allDimensionsFilled) return;

    setIsSynthesizing(true);

    try {
      const response = await wordpressAPI.synthesizeIkigaiPaths({
        love_tags: dimensions.love.tags,
        talent_tags: dimensions.talent.tags,
        need_tags: dimensions.need.tags,
        market_tags: dimensions.market.tags,
      });

      if (response) {
        setSynthesisResult(response);

        // Save synthesis to backend
        const sessionId = savedIkigaiId || await ensureSession();
        if (sessionId) {
          await wordpressAPI.updateIkigai(sessionId, {
            summary: response.summary,
            paths: response.paths,
            status: 'completed',
          });
        }

        setCurrentView(VIEWS.RESULTS);
      }
    } catch (err) {
      console.error('[Ikigai] Failed to synthesize paths:', err);
    } finally {
      setIsSynthesizing(false);
    }
  }, [allDimensionsFilled, dimensions, savedIkigaiId, ensureSession]);

  /**
   * Handle remove tag from dimension
   */
  const handleRemoveTag = useCallback((dimensionKey, tagToRemove) => {
    setDimensions((prev) => {
      const newTags = prev[dimensionKey].tags.filter((tag) => tag !== tagToRemove);
      return {
        ...prev,
        [dimensionKey]: { ...prev[dimensionKey], tags: newTags },
      };
    });
  }, []);

  /**
   * Handle edit - go back to compass from results
   */
  const handleEdit = useCallback(() => {
    setSynthesisResult(null);
    setCurrentView(VIEWS.COMPASS);
  }, []);

  /**
   * Render current view
   */
  const renderContent = () => {
    switch (currentView) {
      case VIEWS.DASHBOARD:
        return (
          <IkigaiDashboard
            onStartNew={handleStartNew}
            onContinueSession={handleContinueSession}
            onNavigateToHistory={onNavigateToHistory}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            setPendingAction={setPendingAction}
            selectedMicrophoneId={selectedMicrophoneId}
            onMicrophoneChange={setSelectedMicrophoneId}
            onTestMicrophone={() => setShowMicrophoneTest(true)}
          />
        );

      case VIEWS.RESULTS:
        return (
          <>
            <FeatureAppHeader
              featureId="ikigai"
              icon={Compass}
              title="Ikigai-Kompass"
              subtitle="Deine Ergebnisse"
              gradient={ikigaiGradient}
              showBackButton
              onBack={handleBackToDashboard}
            />
            <IkigaiResults
              dimensions={dimensions}
              synthesisResult={synthesisResult}
              onStartNew={handleStartNew}
              onEdit={handleEdit}
              DIMENSIONS={DIMENSIONS}
            />
          </>
        );

      case VIEWS.COMPASS:
      default:
        return (
          <>
            <FeatureAppHeader
              featureId="ikigai"
              icon={Compass}
              title="Ikigai-Kompass"
              subtitle="Finde deine berufliche Bestimmung"
              gradient={ikigaiGradient}
              showBackButton
              onBack={handleBackToDashboard}
            />
            <IkigaiCompass
              dimensions={dimensions}
              DIMENSIONS={DIMENSIONS}
              onExtractKeywords={extractKeywords}
              onUpdateDimension={updateDimension}
              onRemoveTag={handleRemoveTag}
              allDimensionsFilled={allDimensionsFilled}
              onSynthesize={handleSynthesize}
              isSynthesizing={isSynthesizing}
              selectedMicrophoneId={selectedMicrophoneId}
              onMicrophoneChange={setSelectedMicrophoneId}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-full">
      {renderContent()}

      {/* Microphone Test Dialog - available from dashboard */}
      <MicrophoneTestDialog
        isOpen={showMicrophoneTest}
        onClose={() => setShowMicrophoneTest(false)}
        deviceId={selectedMicrophoneId}
      />
    </div>
  );
};

export default IkigaiApp;
