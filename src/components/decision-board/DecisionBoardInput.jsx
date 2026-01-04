import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Scale,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  Lightbulb,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Wand2,
} from 'lucide-react';
import { Card } from '@/components/ui/themed/Card';
import { Button } from '@/components/ui/themed/Button';
import { Input } from '@/components/ui/base/input';
import { Textarea } from '@/components/ui/base/textarea';
import { analyzeDecision, brainstormArguments } from '@/services/gemini';
import AudioRecorder from './AudioRecorder';
import DeepDiveWizard from './DeepDiveWizard';
import { COLORS } from '@/config/colors';

/**
 * Generate unique ID for items
 */
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Persona definitions for brainstorming
 */
const PERSONAS = [
  {
    id: 'strategist',
    name: 'Der Stratege',
    icon: '♟️',
    color: COLORS.indigo[500],
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-600',
    description: 'Karriere, Geld, Macht',
  },
  {
    id: 'security',
    name: 'Der Sicherheits-Beauftragte',
    icon: '🛡️',
    color: COLORS.cyan[600],
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-600',
    textColor: 'text-cyan-700',
    description: 'Risiko, Beständigkeit',
  },
  {
    id: 'feelgood',
    name: 'Der Feel-Good Manager',
    icon: '🧘',
    color: COLORS.emerald[500],
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-600',
    description: 'Work-Life-Balance, Kultur',
  },
  {
    id: 'growth',
    name: 'Der Gründer',
    icon: '🚀',
    color: COLORS.amber[500],
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-600',
    description: 'Wachstum, Innovation',
  },
  {
    id: 'future',
    name: 'Dein Zukunfts-Ich',
    icon: '🔮',
    color: COLORS.violet[500],
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-600',
    description: 'Langzeit, Reue-Vermeidung',
  },
];

/**
 * Weight Slider Component - compact for mobile
 */
const WeightSlider = ({ value, onChange, onChangeEnd, color }) => {
  const isGreen = color === 'green';
  const accentColor = isGreen ? COLORS.green[500] : COLORS.red[500];

  return (
    <div className="flex items-center gap-2 min-w-[90px] shrink-0">
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        onMouseUp={onChangeEnd}
        onTouchEnd={onChangeEnd}
        className="w-[60px] h-1.5 rounded cursor-pointer appearance-none shrink-0"
        style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${(value - 1) * 11.1}%, ${COLORS.slate[200]} ${(value - 1) * 11.1}%, ${COLORS.slate[200]} 100%)`,
        }}
      />
      <span className={`min-w-[20px] text-center font-semibold text-sm shrink-0 ${isGreen ? 'text-green-700' : 'text-red-700'}`}>
        {value}
      </span>
    </div>
  );
};

/**
 * Decision Item Component - Mobile responsive with multiline support
 */
const DecisionItem = ({ item, onUpdate, onDelete, onBlur, color, autoFocus }) => {
  const isGreen = color === 'green';
  const textareaRef = React.useRef(null);

  // Auto-resize textarea based on content
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(44, textarea.scrollHeight) + 'px';
    }
  }, [item.text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: isGreen ? -20 : 20 }}
      transition={{ duration: 0.2 }}
      className={`decision-item flex flex-wrap items-start gap-2.5 p-3 rounded-lg border ${
        isGreen
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* Icon + Textarea Row */}
      <div className="decision-item-input-row flex items-start gap-2.5 flex-[1_1_100%] min-w-0">
        {/* Icon */}
        <div className="shrink-0 pt-2">
          {isGreen ? (
            <ThumbsUp size={20} className="text-green-700" />
          ) : (
            <ThumbsDown size={20} className="text-red-700" />
          )}
        </div>
        <Textarea
          ref={textareaRef}
          value={item.text}
          onChange={(e) => onUpdate(item.id, { text: e.target.value })}
          onBlur={onBlur}
          autoFocus={autoFocus}
          placeholder={isGreen ? 'Pro-Argument...' : 'Contra-Argument...'}
          rows={1}
          className={`flex-1 min-w-0 bg-white rounded-md px-3 py-2 text-base resize-none min-h-[44px] overflow-hidden border ${
            isGreen ? 'border-green-300' : 'border-red-300'
          }`}
        />
      </div>
      {/* Controls Row - wraps to new line on mobile */}
      <div className="decision-item-controls flex items-center justify-end gap-2 shrink-0 ml-auto">
        <WeightSlider
          value={item.weight}
          onChange={(weight) => onUpdate(item.id, { weight })}
          onChangeEnd={onBlur}
          color={color}
        />
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 bg-transparent border-none rounded cursor-pointer text-slate-400 transition-all shrink-0 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Rational Score Bar Component
 */
const RationalScoreBar = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  return (
    <div className="mt-6">
      <div className="flex justify-between mb-2 text-base font-semibold">
        <span className="text-green-700">Pro: {proScore} Punkte ({proPercentage}%)</span>
        <span className="text-red-700">Contra: {contraScore} Punkte ({contraPercentage}%)</span>
      </div>
      <div className="h-6 rounded-lg overflow-hidden flex bg-slate-100 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full flex items-center justify-center text-white font-semibold text-xs bg-gradient-to-r from-green-500 to-green-600"
          style={{ minWidth: proPercentage > 10 ? 'auto' : '0' }}
        >
          {proPercentage > 15 && `${proPercentage}%`}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${contraPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full flex items-center justify-center text-white font-semibold text-xs bg-gradient-to-r from-red-500 to-red-600"
          style={{ minWidth: contraPercentage > 10 ? 'auto' : '0' }}
        >
          {contraPercentage > 15 && `${contraPercentage}%`}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Brainstorm Suggestion Card with weight adjustment
 */
const SuggestionCard = ({ suggestion, onAdd, isAdded }) => {
  const isPro = suggestion.type === 'pro';
  const [weight, setWeight] = React.useState(5);
  const accentColor = isPro ? COLORS.green[500] : COLORS.red[500];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col gap-2 px-4 py-3 rounded-lg border ${
        isPro
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      {/* Top row: Icon + Text */}
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
          isPro ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isPro ? (
            <ThumbsUp size={14} className="text-green-700" />
          ) : (
            <ThumbsDown size={14} className="text-red-700" />
          )}
        </div>
        <span className="flex-1 text-base text-slate-600 leading-snug">
          {suggestion.text}
        </span>
      </div>

      {/* Bottom row: Weight slider + Add button */}
      <div className="flex items-center justify-between gap-3 pl-9">
        {/* Weight Slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Gewichtung:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value))}
            disabled={isAdded}
            className="w-[80px] h-1.5 rounded cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${(weight - 1) * 11.1}%, ${COLORS.slate[200]} ${(weight - 1) * 11.1}%, ${COLORS.slate[200]} 100%)`,
              opacity: isAdded ? 0.5 : 1,
            }}
          />
          <span className={`min-w-[20px] text-center font-semibold text-sm ${isPro ? 'text-green-700' : 'text-red-700'}`}>
            {weight}
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={() => onAdd({ ...suggestion, weight })}
          disabled={isAdded}
          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            isAdded
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
              : isPro
                ? 'bg-green-50 border-green-300 text-green-600 cursor-pointer hover:bg-green-100 hover:border-green-400'
                : 'bg-red-50 border-red-300 text-red-600 cursor-pointer hover:bg-red-100 hover:border-red-400'
          }`}
        >
          {isAdded ? '✓' : <Plus size={20} strokeWidth={2.5} />}
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Brainstorm Popover Component
 */
const BrainstormPopover = ({
  isOpen,
  onClose,
  activePersona,
  isLoading,
  suggestions,
  onAddSuggestion,
  onLoadMore,
  addedSuggestions,
}) => {
  if (!isOpen) return null;

  const persona = PERSONAS.find(p => p.id === activePersona);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative mt-4 p-5 bg-white rounded-xl shadow-lg border-2"
      style={{ borderColor: persona?.color || COLORS.indigo[500] }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-10 h-10 rounded-md border-none bg-slate-100 text-slate-600 cursor-pointer flex items-center justify-center hover:bg-slate-200"
      >
        <X size={20} strokeWidth={2.5} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pr-8">
        <span className="text-4xl">{persona?.icon}</span>
        <div>
          <h4 className="text-lg font-semibold text-slate-800 m-0">
            {persona?.name}
          </h4>
          <p className="text-sm text-slate-600 m-0">
            {persona?.description}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: persona?.color }}
          />
          <span className="text-slate-600 text-base">
            {persona?.name} denkt nach...
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Pro suggestions */}
          <div className="mb-2">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Pro-Argumente
            </span>
          </div>
          {suggestions
            .filter(s => s.type === 'pro')
            .map((suggestion, idx) => (
              <SuggestionCard
                key={`pro-${idx}`}
                suggestion={suggestion}
                onAdd={onAddSuggestion}
                isAdded={addedSuggestions.has(`${suggestion.type}-${suggestion.text}`)}
              />
            ))}

          {/* Contra suggestions */}
          <div className="mt-3 mb-2">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Contra-Argumente
            </span>
          </div>
          {suggestions
            .filter(s => s.type === 'con')
            .map((suggestion, idx) => (
              <SuggestionCard
                key={`con-${idx}`}
                suggestion={suggestion}
                onAdd={onAddSuggestion}
                isAdded={addedSuggestions.has(`${suggestion.type}-${suggestion.text}`)}
              />
            ))}

          {/* Load More Button */}
          {suggestions.length > 0 && onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="mt-4 py-3 px-4 bg-transparent border-2 border-dashed rounded-lg text-base font-medium cursor-pointer flex items-center justify-center gap-2 w-full transition-all disabled:cursor-not-allowed disabled:opacity-60 hover:bg-slate-50"
              style={{
                borderColor: persona?.color || COLORS.slate[200],
                color: persona?.color || COLORS.slate[500],
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generiere mehr...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Mehr Inspirationen
                </>
              )}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Persona Toolbar Component
 */
const PersonaToolbar = ({
  topic,
  onSelectPersona,
  activePersona,
  isLoading,
  suggestions,
  onCloseBrainstorm,
  onAddSuggestion,
  onLoadMore,
  addedSuggestions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTopic = topic.trim().length > 0;

  return (
    <Card variant="elevated" className="mb-4 p-4 md:p-6">
      <div
        className="flex items-center justify-between cursor-pointer gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
            <Users size={20} color="white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 m-0">
              Brainstorming
            </h3>
            <p className="text-base text-slate-600 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
              Frag dein inneres Team
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={22} className="text-slate-500 shrink-0" />
        ) : (
          <ChevronDown size={22} className="text-slate-500 shrink-0" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              {/* Persona Buttons - wrap on smaller screens */}
              <div className="flex flex-wrap gap-2 pb-2">
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasTopic) onSelectPersona(persona.id);
                    }}
                    disabled={!hasTopic || (isLoading && activePersona === persona.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md border-2 cursor-pointer transition-all whitespace-nowrap ${
                      activePersona === persona.id
                        ? `${persona.bgColor} ${persona.borderColor}`
                        : 'bg-white border-slate-200'
                    } ${!hasTopic ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {isLoading && activePersona === persona.id ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                        style={{ color: persona.color }}
                      />
                    ) : (
                      <span className="text-lg">{persona.icon}</span>
                    )}
                    <span className={`text-sm font-medium ${
                      activePersona === persona.id ? persona.textColor : 'text-slate-600'
                    }`}>
                      {persona.name.replace('Der ', '').replace('Dein ', '')}
                    </span>
                  </button>
                ))}
              </div>

              {!hasTopic && (
                <p className="mt-3 text-sm text-slate-400 italic">
                  Gib zuerst deine Entscheidungsfrage ein, um Vorschläge zu erhalten.
                </p>
              )}

              {/* Brainstorm Popover */}
              <AnimatePresence>
                {activePersona && (
                  <BrainstormPopover
                    isOpen={!!activePersona}
                    onClose={onCloseBrainstorm}
                    activePersona={activePersona}
                    isLoading={isLoading}
                    suggestions={suggestions}
                    onAddSuggestion={onAddSuggestion}
                    onLoadMore={onLoadMore}
                    addedSuggestions={addedSuggestions}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

/**
 * DecisionBoardInput - Main Input Component
 */
const DecisionBoardInput = ({
  initialData,
  onAnalysisComplete,
  onCancel,
  isAuthenticated,
  requireAuth,
  savedDecisionId,
  onSaveDraft,
  onUpdateSession,
  onDecisionIdChange,
  selectedMicrophoneId,
  onMicrophoneChange,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Initialize state from initialData if provided (for editing)
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [context, setContext] = useState(initialData?.context || '');
  const [pros, setPros] = useState(initialData?.pros || [
    { id: generateId(), text: '', weight: 5 },
  ]);
  const [cons, setCons] = useState(initialData?.cons || [
    { id: generateId(), text: '', weight: 5 },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [focusedItemId, setFocusedItemId] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Auto-save tracking
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = React.useRef(null);

  // Brainstorming state
  const [brainstormState, setBrainstormState] = useState({
    activePersona: null,
    isLoading: false,
    suggestions: [],
  });
  const [addedSuggestions, setAddedSuggestions] = useState(new Set());

  // Calculate scores
  const proScore = useMemo(() =>
    pros.reduce((acc, item) => acc + (item.text.trim() ? item.weight : 0), 0),
    [pros]
  );

  const contraScore = useMemo(() =>
    cons.reduce((acc, item) => acc + (item.text.trim() ? item.weight : 0), 0),
    [cons]
  );

  // Check if we have valid items
  const hasValidPros = pros.some(item => item.text.trim());
  const hasValidCons = cons.some(item => item.text.trim());
  const canAnalyze = topic.trim() && (hasValidPros || hasValidCons);

  /**
   * Auto-save current data (debounced)
   */
  const autoSave = useCallback(async () => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't save if no topic or no save handlers
    if (!topic.trim() || !onSaveDraft || !onUpdateSession) {
      return;
    }

    const currentData = {
      topic,
      context,
      pros,
      cons,
      proScore,
      contraScore,
    };

    setIsSaving(true);

    try {
      if (savedDecisionId) {
        // Update existing session
        await onUpdateSession(savedDecisionId, {
          ...currentData,
          status: 'draft',
        });
        console.log('[DecisionBoard] Auto-saved (update):', savedDecisionId);
      } else {
        // Create new session
        const newId = await onSaveDraft(currentData);
        if (newId && onDecisionIdChange) {
          onDecisionIdChange(newId);
        }
        console.log('[DecisionBoard] Auto-saved (create):', newId);
      }
    } catch (err) {
      console.error('[DecisionBoard] Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [topic, context, pros, cons, proScore, contraScore, savedDecisionId, onSaveDraft, onUpdateSession, onDecisionIdChange]);

  /**
   * Handle blur - save immediately (no debounce)
   * This ensures data is saved when user leaves a field
   */
  const handleFieldBlur = useCallback(() => {
    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately
    autoSave();
  }, [autoSave]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Add new item
  const addPro = useCallback(() => {
    const newId = generateId();
    setPros(prev => [...prev, { id: newId, text: '', weight: 5 }]);
    setFocusedItemId(newId);
  }, []);

  const addCon = useCallback(() => {
    const newId = generateId();
    setCons(prev => [...prev, { id: newId, text: '', weight: 5 }]);
    setFocusedItemId(newId);
  }, []);

  // Update item
  const updatePro = useCallback((id, updates) => {
    setPros(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const updateCon = useCallback((id, updates) => {
    setCons(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // Delete item
  const deletePro = useCallback((id) => {
    setPros(prev => prev.filter(item => item.id !== id));
  }, []);

  const deleteCon = useCallback((id) => {
    setCons(prev => prev.filter(item => item.id !== id));
  }, []);

  // Brainstorming handlers
  const handleSelectPersona = useCallback(async (personaId) => {
    setBrainstormState(prev => ({
      ...prev,
      activePersona: personaId,
      isLoading: true,
      suggestions: [],
    }));

    try {
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      const contextTrimmed = context.trim() || null;
      // Pass existing pros and cons to avoid duplicates and get fresh perspectives
      const result = await brainstormArguments(topic, personaId, apiKey, contextTrimmed, pros, cons);

      setBrainstormState(prev => ({
        ...prev,
        isLoading: false,
        suggestions: result.suggestions || [],
      }));
    } catch (err) {
      console.error('[DecisionBoard] Brainstorm error:', err);
      setBrainstormState(prev => ({
        ...prev,
        isLoading: false,
        suggestions: [],
      }));
      setError(err.message || 'Fehler beim Brainstorming');
    }
  }, [topic, context, pros, cons]);

  const handleCloseBrainstorm = useCallback(() => {
    setBrainstormState({
      activePersona: null,
      isLoading: false,
      suggestions: [],
    });
  }, []);

  const handleAddSuggestion = useCallback((suggestion) => {
    const suggestionKey = `${suggestion.type}-${suggestion.text}`;
    setAddedSuggestions(prev => new Set([...prev, suggestionKey]));

    const newItem = {
      id: generateId(),
      text: suggestion.text,
      weight: suggestion.weight || 5,
    };

    if (suggestion.type === 'pro') {
      setPros(prev => {
        // If first item is empty placeholder, replace it
        if (prev.length === 1 && !prev[0].text.trim()) {
          return [newItem];
        }
        return [...prev, newItem];
      });
    } else {
      setCons(prev => {
        // If first item is empty placeholder, replace it
        if (prev.length === 1 && !prev[0].text.trim()) {
          return [newItem];
        }
        return [...prev, newItem];
      });
    }
  }, []);

  /**
   * Load more suggestions - generates 3 more pro and 3 more contra
   * Passes all existing captured points AND current suggestions to avoid duplicates
   */
  const handleLoadMore = useCallback(async () => {
    const { activePersona, suggestions: currentSuggestions } = brainstormState;
    if (!activePersona) return;

    setBrainstormState(prev => ({
      ...prev,
      isLoading: true,
    }));

    try {
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      // Combine existing captured pros/cons with current suggestions
      // This prevents the API from repeating any previously shown suggestions
      const currentProSuggestions = currentSuggestions
        .filter(s => s.type === 'pro')
        .map(s => ({ text: s.text }));
      const currentConSuggestions = currentSuggestions
        .filter(s => s.type === 'con')
        .map(s => ({ text: s.text }));

      const combinedPros = [...pros, ...currentProSuggestions];
      const combinedCons = [...cons, ...currentConSuggestions];

      const contextTrimmed = context.trim() || null;
      const result = await brainstormArguments(topic, activePersona, apiKey, contextTrimmed, combinedPros, combinedCons);

      // Append new suggestions to existing ones
      setBrainstormState(prev => ({
        ...prev,
        isLoading: false,
        suggestions: [...prev.suggestions, ...(result.suggestions || [])],
      }));
    } catch (err) {
      console.error('[DecisionBoard] Load more error:', err);
      setBrainstormState(prev => ({
        ...prev,
        isLoading: false,
      }));
      setError(err.message || 'Fehler beim Laden weiterer Vorschläge');
    }
  }, [brainstormState, topic, context, pros, cons]);

  // Handle audio transcript
  const handleTranscriptReady = useCallback((transcript) => {
    setContext(prev => {
      if (prev.trim()) {
        return prev.trim() + '\n\n' + transcript;
      }
      return transcript;
    });
  }, []);

  // Handle items from Deep Dive Wizard
  const handleWizardAddItems = useCallback((items) => {
    items.forEach((item) => {
      const newItem = {
        id: generateId(),
        text: item.text,
        weight: item.weight || 5,
      };

      if (item.type === 'pro') {
        setPros(prev => {
          // If first item is empty placeholder, replace it
          if (prev.length === 1 && !prev[0].text.trim()) {
            return [newItem];
          }
          return [...prev, newItem];
        });
      } else {
        setCons(prev => {
          // If first item is empty placeholder, replace it
          if (prev.length === 1 && !prev[0].text.trim()) {
            return [newItem];
          }
          return [...prev, newItem];
        });
      }
    });

    // Trigger auto-save after adding items
    setTimeout(() => autoSave(), 100);
  }, [autoSave]);

  // Analyze decision
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      const validPros = pros.filter(item => item.text.trim());
      const validCons = cons.filter(item => item.text.trim());

      const decisionData = {
        topic,
        context: context.trim() || null,
        pros: validPros,
        cons: validCons,
        proScore,
        contraScore,
      };

      const result = await analyzeDecision(decisionData, apiKey);
      onAnalysisComplete(decisionData, result);
    } catch (err) {
      console.error('[DecisionBoard] Analysis error:', err);
      setError(err.message || 'Fehler bei der Analyse');
    } finally {
      setIsAnalyzing(false);
    }
  }, [topic, context, pros, cons, proScore, contraScore, canAnalyze, onAnalysisComplete]);

  return (
    <div className="p-4 max-w-[1200px] mx-auto">
      {/* Top Bar with Cancel Button */}
      {onCancel && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-600 cursor-pointer text-base font-medium transition-all hover:bg-red-50 hover:border-red-500 hover:text-red-700"
          >
            <X size={18} />
            Abbrechen
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-4 text-center">
        <p className="text-sm text-slate-400 max-w-[600px] mx-auto">
          Analysiere deine Entscheidung objektiv. Gewichte Pro und Contra,
          und erhalte KI-gestützte Impulse für blinde Flecken.
        </p>
      </div>

      {/* Decision Question Card */}
      <Card variant="elevated" className="mb-4 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-800">Deine Entscheidungsfrage</h3>
        </div>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onBlur={handleFieldBlur}
          placeholder="z.B. Soll ich das Jobangebot annehmen?"
          className="text-lg p-4 rounded-lg mb-4"
        />

        {/* Context / Situation Description with integrated Audio */}
        <div className="mt-2">
          <label className="block text-base font-medium text-slate-600 mb-2">
            Beschreibe die Situation (optional)
          </label>

          <div className="context-input-wrapper flex flex-wrap items-end gap-3">
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              onBlur={handleFieldBlur}
              placeholder="Hintergrund, Rahmenbedingungen, Gefühle, was dich beschäftigt..."
              rows={3}
              className="flex-[1_1_300px] min-w-0 text-base px-4 py-3 rounded-lg resize-y min-h-[80px]"
            />
            <div className="shrink-0 pb-1">
              <AudioRecorder
                onTranscriptReady={handleTranscriptReady}
                warmUp={!!selectedMicrophoneId}
                deviceId={selectedMicrophoneId}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Deep Dive Wizard Card */}
      <Card
        variant="elevated"
        className={`mb-4 p-4 md:p-6 transition-all ${
          topic.trim() ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-60'
        }`}
        onClick={() => topic.trim() && setIsWizardOpen(true)}
      >
        <div className="deep-dive-card-content flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-[1_1_auto] min-w-[200px]">
            <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-brand-gradient">
              <Wand2 size={20} color="white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-800 m-0">
                Deep Dive Interview
              </h3>
              <p className="text-sm text-slate-600 m-0 leading-snug">
                Entdecke verborgene Argumente durch gezielte Coaching-Fragen
              </p>
            </div>
          </div>
          <Button
            variant="solid"
            size="sm"
            disabled={!topic.trim()}
            onClick={(e) => {
              e.stopPropagation();
              if (topic.trim()) setIsWizardOpen(true);
            }}
            className={`shrink-0 ${topic.trim() ? 'bg-brand-gradient' : ''}`}
          >
            <Sparkles size={18} className="mr-1.5" />
            Starten
          </Button>
        </div>
      </Card>

      {/* Persona Toolbar - Brainstorming Section */}
      <PersonaToolbar
        topic={topic}
        onSelectPersona={handleSelectPersona}
        activePersona={brainstormState.activePersona}
        isLoading={brainstormState.isLoading}
        suggestions={brainstormState.suggestions}
        onCloseBrainstorm={handleCloseBrainstorm}
        onAddSuggestion={handleAddSuggestion}
        onLoadMore={handleLoadMore}
        addedSuggestions={addedSuggestions}
      />

      {/* Pro/Contra Split - responsive grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4 mb-6">
        {/* Pro Column */}
        <div className="decision-card-pro bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-green-50 flex items-center justify-center">
              <ThumbsUp size={20} className="text-green-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 m-0">PRO</h3>
              <p className="text-base text-slate-600 m-0">Was spricht dafür?</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {pros.map((item) => (
                <DecisionItem
                  key={item.id}
                  item={item}
                  onUpdate={updatePro}
                  onDelete={deletePro}
                  onBlur={handleFieldBlur}
                  color="green"
                  autoFocus={focusedItemId === item.id}
                />
              ))}
            </AnimatePresence>
            <Button
              variant="outline"
              onClick={addPro}
              className="border-green-500 text-green-700 border-dashed"
            >
              <Plus size={18} className="mr-2" />
              Argument hinzufügen
            </Button>
          </div>
        </div>

        {/* Contra Column */}
        <div className="decision-card-contra bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center">
              <ThumbsDown size={20} className="text-red-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-700 m-0">CONTRA</h3>
              <p className="text-base text-slate-600 m-0">Was spricht dagegen?</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {cons.map((item) => (
                <DecisionItem
                  key={item.id}
                  item={item}
                  onUpdate={updateCon}
                  onDelete={deleteCon}
                  onBlur={handleFieldBlur}
                  color="red"
                  autoFocus={focusedItemId === item.id}
                />
              ))}
            </AnimatePresence>
            <Button
              variant="outline"
              onClick={addCon}
              className="border-red-500 text-red-700 border-dashed"
            >
              <Plus size={18} className="mr-2" />
              Argument hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Score Bar */}
      {(hasValidPros || hasValidCons) && (
        <Card variant="elevated" className="mb-6 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-slate-800">Rationaler Score</h3>
          </div>
          <RationalScoreBar proScore={proScore} contraScore={contraScore} />
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700"
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          variant="solid"
          size="lg"
          className={`px-8 py-4 text-xl ${canAnalyze ? 'bg-brand-gradient' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={22} className="mr-2.5 animate-spin" />
              Analyse läuft...
            </>
          ) : (
            <>
              <Sparkles size={22} className="mr-2.5" />
              Entscheidung analysieren
            </>
          )}
        </Button>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid currentColor;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            border: 2px solid currentColor;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          /* Mobile responsive: stack controls below textarea */
          @media (max-width: 480px) {
            .decision-item {
              flex-direction: column !important;
            }
            .decision-item-input-row {
              width: 100% !important;
              flex: 1 1 100% !important;
            }
            .decision-item-controls {
              width: 100% !important;
              justify-content: flex-start !important;
              padding-left: 32px;
            }
          }

          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-[400px] w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-md bg-red-50 flex items-center justify-center">
                  <AlertCircle size={22} className="text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 m-0">
                  Session abbrechen?
                </h3>
              </div>
              <p className="text-base text-slate-600 mb-6 leading-relaxed">
                Alle eingegebenen Daten werden verworfen und nicht gespeichert.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Zurück
                </Button>
                <Button
                  variant="solid"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    onCancel();
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <X size={18} className="mr-2" />
                  Abbrechen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deep Dive Wizard Modal */}
      <DeepDiveWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        topic={topic}
        existingPros={pros}
        existingCons={cons}
        onAddItems={handleWizardAddItems}
        selectedMicrophoneId={selectedMicrophoneId}
      />
    </div>
  );
};

export default DecisionBoardInput;
