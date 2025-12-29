import React, { useState, useCallback, useEffect, useRef } from 'react';
import IkigaiCompass from './IkigaiCompass';
import IkigaiResults from './IkigaiResults';
import wordpressAPI from '@/services/wordpress-api';

/**
 * View states for the Ikigai flow
 */
const VIEWS = {
  COMPASS: 'compass',
  RESULTS: 'results',
};

/**
 * Dimension configuration
 */
const DIMENSIONS = {
  love: {
    key: 'love',
    label: 'Leidenschaft',
    title: 'Deine Leidenschaft',
    icon: '❤️',
    color: '#E11D48', // Rose-600
    question: 'Stell dir vor, Geld spielt keine Rolle: Womit würdest du deinen Tag verbringen? Bei welchem Thema vergisst du völlig die Zeit?',
    placeholder: 'Schreib einfach drauf los: Hobbys, Themen, Tätigkeiten...',
    description: 'Was treibt dich an?',
  },
  talent: {
    key: 'talent',
    label: 'Stärken',
    title: 'Deine Stärken',
    icon: '⭐',
    color: '#F59E0B', // Amber-500
    question: 'Wofür bitten dich Freunde oder Kollegen oft um Rat? Was erledigst du "mit links", während andere daran verzweifeln?',
    placeholder: 'Z.B. Organisieren, Zuhören, Coden, Designen...',
    description: 'Was fällt dir leicht?',
  },
  need: {
    key: 'need',
    label: 'Mission',
    title: 'Deine Mission',
    icon: '🌍',
    color: '#10B981', // Emerald-500
    question: 'Welches Problem in der Gesellschaft oder Wirtschaft nervt dich? Wo würdest du gerne mitanpacken, um Dinge zu verbessern?',
    placeholder: 'Z.B. Nachhaltigkeit, Bildung, bessere Software, Pflege...',
    description: 'Welchen Beitrag leistest du?',
  },
  market: {
    key: 'market',
    label: 'Markt',
    title: 'Der Markt',
    icon: '💰',
    color: '#6366F1', // Indigo-500
    question: 'Welche deiner Fähigkeiten sind bares Geld wert? Für welche Jobs oder Dienstleistungen existiert ein echtes Budget?',
    placeholder: 'Z.B. Projektmanagement, Beratung, Handwerk...',
    description: 'Wofür wirst du bezahlt?',
  },
};

/**
 * IkigaiApp - Main Component
 *
 * "Der Ikigai-Kompass" - Career Pathfinder
 *
 * Coordinates the flow:
 * 1. User clicks on circles to fill each dimension
 * 2. AI extracts keywords from their responses
 * 3. When all 4 dimensions are filled, synthesize career paths
 * 4. Show results with training recommendations
 */
const IkigaiApp = ({
  isAuthenticated,
  requireAuth,
  setPendingAction,
  onNavigateToHistory,
}) => {
  const [currentView, setCurrentView] = useState(VIEWS.COMPASS);
  const [savedIkigaiId, setSavedIkigaiId] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

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

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Check if all dimensions have tags
  const allDimensionsFilled = Object.values(dimensions).every(
    (dim) => dim.tags && dim.tags.length > 0
  );

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
   * Handle start new analysis
   */
  const handleStartNew = useCallback(() => {
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
   * Handle edit - go back to compass
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
      case VIEWS.RESULTS:
        return (
          <IkigaiResults
            dimensions={dimensions}
            synthesisResult={synthesisResult}
            onStartNew={handleStartNew}
            onEdit={handleEdit}
            DIMENSIONS={DIMENSIONS}
          />
        );

      case VIEWS.COMPASS:
      default:
        return (
          <IkigaiCompass
            dimensions={dimensions}
            DIMENSIONS={DIMENSIONS}
            onExtractKeywords={extractKeywords}
            onUpdateDimension={updateDimension}
            onRemoveTag={handleRemoveTag}
            allDimensionsFilled={allDimensionsFilled}
            onSynthesize={handleSynthesize}
            isSynthesizing={isSynthesizing}
          />
        );
    }
  };

  return (
    <div style={{ minHeight: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default IkigaiApp;
