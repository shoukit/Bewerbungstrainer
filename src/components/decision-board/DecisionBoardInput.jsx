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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useBranding } from '@/hooks/useBranding';
import { analyzeDecision, brainstormArguments } from '@/services/gemini';
import AudioRecorder from './AudioRecorder';

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
    color: '#6366f1',
    bgColor: '#eef2ff',
    description: 'Karriere, Geld, Macht',
  },
  {
    id: 'security',
    name: 'Der Sicherheits-Beauftragte',
    icon: '🛡️',
    color: '#0891b2',
    bgColor: '#ecfeff',
    description: 'Risiko, Beständigkeit',
  },
  {
    id: 'feelgood',
    name: 'Der Feel-Good Manager',
    icon: '🧘',
    color: '#10b981',
    bgColor: '#ecfdf5',
    description: 'Work-Life-Balance, Kultur',
  },
  {
    id: 'growth',
    name: 'Der Gründer',
    icon: '🚀',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    description: 'Wachstum, Innovation',
  },
  {
    id: 'future',
    name: 'Dein Zukunfts-Ich',
    icon: '🔮',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    description: 'Langzeit, Reue-Vermeidung',
  },
];

/**
 * Weight Slider Component - compact for mobile
 */
const WeightSlider = ({ value, onChange, onChangeEnd, color, b }) => {
  const isGreen = color === 'green';
  const accentColor = isGreen ? b.success : b.error;
  const accentDark = isGreen ? b.successDark : b.errorDark;
  const accentLight = isGreen ? b.successLight : b.errorLight;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], minWidth: '90px', flexShrink: 0 }}>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        onMouseUp={onChangeEnd}
        onTouchEnd={onChangeEnd}
        style={{
          width: '60px',
          height: '6px',
          borderRadius: b.radius.sm,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${(value - 1) * 11.1}%, ${b.borderColor} ${(value - 1) * 11.1}%, ${b.borderColor} 100%)`,
          appearance: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          minWidth: '20px',
          textAlign: 'center',
          fontWeight: b.fontWeight.semibold,
          fontSize: b.fontSize.sm,
          color: accentDark,
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Decision Item Component - Mobile responsive with multiline support
 */
const DecisionItem = ({ item, onUpdate, onDelete, onAddNew, onBlur, color, autoFocus, b }) => {
  const isGreen = color === 'green';
  const bgColor = isGreen ? b.successLight : b.errorLight;
  const borderColor = isGreen ? '#bbf7d0' : '#fecaca';
  const inputBorderColor = isGreen ? '#86efac' : '#fca5a5';
  const iconColor = isGreen ? b.successDark : b.errorDark;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: isGreen ? -20 : 20 }}
      transition={{ duration: 0.2 }}
      className="decision-item"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: b.space[2.5],
        padding: b.space[3],
        backgroundColor: bgColor,
        borderRadius: b.radius.lg,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, paddingTop: b.space[2] }}>
        {isGreen ? (
          <ThumbsUp size={b.iconSize.lg} color={iconColor} />
        ) : (
          <ThumbsDown size={b.iconSize.lg} color={iconColor} />
        )}
      </div>
      <Textarea
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={isGreen ? 'Pro-Argument...' : 'Contra-Argument...'}
        rows={2}
        style={{
          flex: 1,
          minWidth: '0',
          backgroundColor: b.white,
          border: `1px solid ${inputBorderColor}`,
          borderRadius: b.radius.md,
          padding: `${b.space[2]} ${b.space[3]}`,
          fontSize: b.fontSize.base,
          resize: 'vertical',
          minHeight: '44px',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], flexShrink: 0, paddingTop: b.space[1.5] }}>
        <WeightSlider
          value={item.weight}
          onChange={(weight) => onUpdate(item.id, { weight })}
          onChangeEnd={onBlur}
          color={color}
          b={b}
        />
        <button
          onClick={() => onDelete(item.id)}
          style={{
            padding: b.space[2],
            backgroundColor: b.transparent,
            border: 'none',
            borderRadius: b.radius.sm,
            cursor: 'pointer',
            color: b.textMuted,
            transition: b.transition.normal,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = b.errorLight;
            e.currentTarget.style.color = b.errorDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = b.transparent;
            e.currentTarget.style.color = b.textMuted;
          }}
        >
          <Trash2 size={b.iconSize.md} />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Rational Score Bar Component
 */
const RationalScoreBar = ({ proScore, contraScore, b }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;
  const contraPercentage = 100 - proPercentage;

  return (
    <div style={{ marginTop: b.space[6] }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: b.space[2],
        fontSize: b.fontSize.base,
        fontWeight: b.fontWeight.semibold,
      }}>
        <span style={{ color: b.successDark }}>Pro: {proScore} Punkte ({proPercentage}%)</span>
        <span style={{ color: b.errorDark }}>Contra: {contraScore} Punkte ({contraPercentage}%)</span>
      </div>
      <div style={{
        height: b.space[6],
        borderRadius: b.radius.lg,
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: b.borderColorLight,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${b.success} 0%, ${b.successDark} 100%)`,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: b.white,
            fontWeight: b.fontWeight.semibold,
            fontSize: b.fontSize.xs,
            minWidth: proPercentage > 10 ? 'auto' : '0',
          }}
        >
          {proPercentage > 15 && `${proPercentage}%`}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${contraPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${b.error} 0%, ${b.errorDark} 100%)`,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: b.white,
            fontWeight: b.fontWeight.semibold,
            fontSize: b.fontSize.xs,
            minWidth: contraPercentage > 10 ? 'auto' : '0',
          }}
        >
          {contraPercentage > 15 && `${contraPercentage}%`}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * Brainstorm Suggestion Card
 */
const SuggestionCard = ({ suggestion, onAdd, isAdded, b }) => {
  const isPro = suggestion.type === 'pro';
  const bgColor = isPro ? b.successLight : b.errorLight;
  const borderColor = isPro ? '#bbf7d0' : '#fecaca';
  const iconBgColor = isPro ? '#dcfce7' : '#fee2e2';
  const iconColor = isPro ? b.successDark : b.errorDark;
  const buttonBg = isPro ? b.success : b.error;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: b.space[3],
        padding: `${b.space[3]} ${b.space[4]}`,
        backgroundColor: bgColor,
        borderRadius: b.radius.md,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{
        width: b.space[6],
        height: b.space[6],
        borderRadius: b.radius.sm,
        backgroundColor: iconBgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isPro ? (
          <ThumbsUp size={b.iconSize.sm} color={iconColor} />
        ) : (
          <ThumbsDown size={b.iconSize.sm} color={iconColor} />
        )}
      </div>
      <span style={{
        flex: 1,
        fontSize: b.fontSize.base,
        color: b.textSecondary,
        lineHeight: 1.4,
      }}>
        {suggestion.text}
      </span>
      <button
        onClick={() => onAdd(suggestion)}
        disabled={isAdded}
        style={{
          width: b.space[12],
          height: b.space[12],
          borderRadius: b.radius.lg,
          border: 'none',
          backgroundColor: isAdded ? b.borderColor : buttonBg,
          color: isAdded ? b.textMuted : b.white,
          cursor: isAdded ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: b.transition.normal,
          flexShrink: 0,
        }}
      >
        {isAdded ? '✓' : <Plus size={b.iconSize['3xl']} color="white" strokeWidth={2.5} />}
      </button>
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
  b,
}) => {
  if (!isOpen) return null;

  const persona = PERSONAS.find(p => p.id === activePersona);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        position: 'relative',
        marginTop: b.space[4],
        padding: b.space[5],
        backgroundColor: b.cardBgColor,
        borderRadius: b.radius.xl,
        border: `2px solid ${persona?.color || '#6366f1'}`,
        boxShadow: b.shadow.lg,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: b.space[3],
          right: b.space[3],
          width: b.space[10],
          height: b.space[10],
          borderRadius: b.radius.md,
          border: 'none',
          backgroundColor: b.borderColorLight,
          color: b.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={b.iconSize['2xl']} strokeWidth={2.5} />
      </button>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: b.space[3],
        marginBottom: b.space[4],
        paddingRight: b.space[8],
      }}>
        <span style={{ fontSize: b.fontSize['5xl'] }}>{persona?.icon}</span>
        <div>
          <h4 style={{
            fontSize: b.fontSize.lg,
            fontWeight: b.fontWeight.semibold,
            color: b.textMain,
            margin: 0,
          }}>
            {persona?.name}
          </h4>
          <p style={{
            fontSize: b.fontSize.sm,
            color: b.textSecondary,
            margin: 0,
          }}>
            {persona?.description}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: b.space[3],
          padding: b.space[6],
        }}>
          <Loader2
            size={b.iconSize['3xl']}
            color={persona?.color}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <span style={{ color: b.textSecondary, fontSize: b.fontSize.base }}>
            {persona?.name} denkt nach...
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[2.5] }}>
          {/* Pro suggestions */}
          <div style={{ marginBottom: b.space[2] }}>
            <span style={{
              fontSize: b.fontSize.xs,
              fontWeight: b.fontWeight.semibold,
              color: b.successDark,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
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
                b={b}
              />
            ))}

          {/* Contra suggestions */}
          <div style={{ marginTop: b.space[3], marginBottom: b.space[2] }}>
            <span style={{
              fontSize: b.fontSize.xs,
              fontWeight: b.fontWeight.semibold,
              color: b.errorDark,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
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
                b={b}
              />
            ))}

          {/* Load More Button */}
          {suggestions.length > 0 && onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              style={{
                marginTop: b.space[4],
                padding: `${b.space[3]} ${b.space[4]}`,
                backgroundColor: 'transparent',
                border: `2px dashed ${persona?.color || b.borderColor}`,
                borderRadius: b.radius.lg,
                color: persona?.color || b.textSecondary,
                fontSize: b.fontSize.base,
                fontWeight: b.fontWeight.medium,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: b.space[2],
                width: '100%',
                transition: b.transition.normal,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={b.iconSize.md} style={{ animation: 'spin 1s linear infinite' }} />
                  Generiere mehr...
                </>
              ) : (
                <>
                  <Sparkles size={b.iconSize.md} />
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
  b,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasTopic = topic.trim().length > 0;

  return (
    <Card variant="elevated" padding="lg" style={{ marginBottom: b.space[4] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: b.space[2],
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3], minWidth: 0 }}>
          <div style={{
            width: b.space[10],
            height: b.space[10],
            borderRadius: b.radius.md,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={b.iconSize.lg} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: b.fontSize.lg,
              fontWeight: b.fontWeight.semibold,
              color: b.textMain,
              margin: 0,
            }}>
              Brainstorming
            </h3>
            <p style={{
              fontSize: b.fontSize.base,
              color: b.textSecondary,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Frag dein inneres Team
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={b.iconSize.xl} color={b.textSecondary} style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={b.iconSize.xl} color={b.textSecondary} style={{ flexShrink: 0 }} />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: b.space[4] }}>
              {/* Persona Buttons - horizontal scroll on mobile */}
              <div style={{
                display: 'flex',
                gap: b.space[2],
                overflowX: 'auto',
                paddingBottom: b.space[2],
                marginLeft: `-${b.space[1]}`,
                marginRight: `-${b.space[1]}`,
                paddingLeft: b.space[1],
                paddingRight: b.space[1],
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasTopic) onSelectPersona(persona.id);
                    }}
                    disabled={!hasTopic || (isLoading && activePersona === persona.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: b.space[1.5],
                      padding: `${b.space[2]} ${b.space[3]}`,
                      borderRadius: b.radius.md,
                      border: activePersona === persona.id
                        ? `2px solid ${persona.color}`
                        : `2px solid ${b.borderColor}`,
                      backgroundColor: activePersona === persona.id
                        ? persona.bgColor
                        : b.cardBgColor,
                      cursor: hasTopic ? 'pointer' : 'not-allowed',
                      opacity: hasTopic ? 1 : 0.5,
                      transition: b.transition.normal,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isLoading && activePersona === persona.id ? (
                      <Loader2
                        size={b.iconSize.sm}
                        color={persona.color}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : (
                      <span style={{ fontSize: b.fontSize.lg }}>{persona.icon}</span>
                    )}
                    <span style={{
                      fontSize: b.fontSize.sm,
                      fontWeight: b.fontWeight.medium,
                      color: activePersona === persona.id ? persona.color : b.textSecondary,
                    }}>
                      {persona.name.replace('Der ', '').replace('Dein ', '')}
                    </span>
                  </button>
                ))}
              </div>

              {!hasTopic && (
                <p style={{
                  marginTop: b.space[3],
                  fontSize: b.fontSize.sm,
                  color: b.textMuted,
                  fontStyle: 'italic',
                }}>
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
                    b={b}
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
}) => {
  const b = useBranding();
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
   * Debounced auto-save (wait 500ms after last change)
   */
  const debouncedAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 500);
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
      weight: 5,
    };

    if (suggestion.type === 'pro') {
      setPros(prev => [...prev, newItem]);
    } else {
      setCons(prev => [...prev, newItem]);
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
    <div style={{ padding: b.space[4], maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Bar with Cancel Button */}
      {onCancel && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: b.space[4],
        }}>
          <button
            onClick={() => setShowCancelConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: b.space[2],
              padding: `${b.space[2]} ${b.space[4]}`,
              borderRadius: b.radius.md,
              border: `1px solid ${b.borderColor}`,
              backgroundColor: b.cardBgColor,
              color: b.textSecondary,
              cursor: 'pointer',
              fontSize: b.fontSize.base,
              fontWeight: b.fontWeight.medium,
              transition: b.transition.normal,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = b.errorLight;
              e.currentTarget.style.borderColor = b.error;
              e.currentTarget.style.color = b.errorDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = b.cardBgColor;
              e.currentTarget.style.borderColor = b.borderColor;
              e.currentTarget.style.color = b.textSecondary;
            }}
          >
            <X size={b.iconSize.md} />
            Abbrechen
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: b.space[6], textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: b.space[15],
          height: b.space[15],
          borderRadius: b.radius.lg,
          background: b.headerGradient,
          marginBottom: b.space[3],
          boxShadow: b.coloredShadow(b.primaryAccent, 'lg'),
        }}>
          <Scale size={b.iconSize['2xl']} color={b.white} />
        </div>
        <h1 style={{
          fontSize: b.fontSize['4xl'],
          fontWeight: b.fontWeight.bold,
          color: b.textMain,
          marginBottom: b.space[1.5],
        }}>
          Der Entscheidungs-Kompass
        </h1>
        <p style={{
          fontSize: b.fontSize.base,
          color: b.textSecondary,
          maxWidth: '600px',
          margin: '0 auto',
          padding: `0 ${b.space[2]}`,
        }}>
          Analysiere deine Entscheidung objektiv. Gewichte Pro und Contra,
          und erhalte KI-gestützte Impulse für blinde Flecken.
        </p>
      </div>

      {/* Decision Question Card */}
      <Card variant="elevated" padding="lg" style={{ marginBottom: b.space[4] }}>
        <CardHeader>
          <CardTitle icon={Lightbulb} size="md">
            Deine Entscheidungsfrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={debouncedAutoSave}
            placeholder="z.B. Soll ich das Jobangebot annehmen?"
            style={{
              fontSize: b.fontSize.lg,
              padding: b.space[4],
              borderRadius: b.radius.lg,
              marginBottom: b.space[4],
            }}
          />

          {/* Context / Situation Description with integrated Audio */}
          <div style={{ marginTop: b.space[2] }}>
            <label style={{
              display: 'block',
              fontSize: b.fontSize.base,
              fontWeight: b.fontWeight.medium,
              color: b.textSecondary,
              marginBottom: b.space[2],
            }}>
              Beschreibe die Situation (optional)
            </label>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: b.space[3],
            }}>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onBlur={debouncedAutoSave}
                placeholder="Hintergrund, Rahmenbedingungen, Gefühle, was dich beschäftigt..."
                rows={3}
                style={{
                  flex: 1,
                  fontSize: b.fontSize.md,
                  padding: `${b.space[3]} ${b.space[4]}`,
                  borderRadius: b.radius.lg,
                  resize: 'vertical',
                  minHeight: '80px',
                }}
              />
              <div style={{ flexShrink: 0, paddingBottom: b.space[1] }}>
                <AudioRecorder onTranscriptReady={handleTranscriptReady} />
              </div>
            </div>
          </div>
        </CardContent>
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
        b={b}
      />

      {/* Pro/Contra Split - responsive grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
        gap: b.space[4],
        marginBottom: b.space[6],
      }}>
        {/* Pro Column */}
        <div
          className="decision-card-pro"
          style={{
            backgroundColor: b.cardBgColor,
            borderRadius: b.radius.lg,
            padding: b.space[6],
            boxShadow: b.shadow.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3], marginBottom: b.space[4] }}>
            <div style={{
              width: b.space[10],
              height: b.space[10],
              borderRadius: b.radius.md,
              backgroundColor: b.successLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ThumbsUp size={b.iconSize.lg} color={b.successDark} />
            </div>
            <div>
              <h3 style={{ fontSize: b.fontSize.xl, fontWeight: b.fontWeight.semibold, color: b.successDark, margin: 0 }}>
                PRO
              </h3>
              <p style={{ fontSize: b.fontSize.base, color: b.textSecondary, margin: 0 }}>
                Was spricht dafür?
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
            <AnimatePresence mode="popLayout">
              {pros.map((item) => (
                <DecisionItem
                  key={item.id}
                  item={item}
                  onUpdate={updatePro}
                  onDelete={deletePro}
                  onAddNew={addPro}
                  onBlur={debouncedAutoSave}
                  color="green"
                  autoFocus={focusedItemId === item.id}
                  b={b}
                />
              ))}
            </AnimatePresence>
            <Button
              variant="outline"
              onClick={addPro}
              style={{
                borderColor: b.success,
                color: b.successDark,
                borderStyle: 'dashed',
              }}
            >
              <Plus size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
              Argument hinzufügen
            </Button>
          </div>
        </div>

        {/* Contra Column */}
        <div
          className="decision-card-contra"
          style={{
            backgroundColor: b.cardBgColor,
            borderRadius: b.radius.lg,
            padding: b.space[6],
            boxShadow: b.shadow.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3], marginBottom: b.space[4] }}>
            <div style={{
              width: b.space[10],
              height: b.space[10],
              borderRadius: b.radius.md,
              backgroundColor: b.errorLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ThumbsDown size={b.iconSize.lg} color={b.errorDark} />
            </div>
            <div>
              <h3 style={{ fontSize: b.fontSize.xl, fontWeight: b.fontWeight.semibold, color: b.errorDark, margin: 0 }}>
                CONTRA
              </h3>
              <p style={{ fontSize: b.fontSize.base, color: b.textSecondary, margin: 0 }}>
                Was spricht dagegen?
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
            <AnimatePresence mode="popLayout">
              {cons.map((item) => (
                <DecisionItem
                  key={item.id}
                  item={item}
                  onUpdate={updateCon}
                  onDelete={deleteCon}
                  onAddNew={addCon}
                  onBlur={debouncedAutoSave}
                  color="red"
                  autoFocus={focusedItemId === item.id}
                  b={b}
                />
              ))}
            </AnimatePresence>
            <Button
              variant="outline"
              onClick={addCon}
              style={{
                borderColor: b.error,
                color: b.errorDark,
                borderStyle: 'dashed',
              }}
            >
              <Plus size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
              Argument hinzufügen
            </Button>
          </div>
        </div>
      </div>

      {/* Score Bar */}
      {(hasValidPros || hasValidCons) && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: b.space[6] }}>
          <CardHeader>
            <CardTitle icon={Scale} size="md">
              Rationaler Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RationalScoreBar proScore={proScore} contraScore={contraScore} b={b} />
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: b.space[3],
            padding: b.space[4],
            backgroundColor: b.errorLight,
            border: `1px solid ${b.error}33`,
            borderRadius: b.radius.lg,
            marginBottom: b.space[6],
            color: b.errorDark,
          }}
        >
          <AlertCircle size={b.iconSize.lg} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Analyze Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          variant="solid"
          size="lg"
          style={{
            padding: `${b.space[4]} ${b.space[8]}`,
            fontSize: b.fontSize.xl,
            background: canAnalyze ? b.headerGradient : undefined,
            boxShadow: canAnalyze ? b.coloredShadow(b.primaryAccent, 'lg') : undefined,
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={b.iconSize.xl} style={{ marginRight: b.space[2.5], animation: 'spin 1s linear infinite' }} />
              Analyse läuft...
            </>
          ) : (
            <>
              <Sparkles size={b.iconSize.xl} style={{ marginRight: b.space[2.5] }} />
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
        `}
      </style>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: b.zIndex.modal,
              padding: b.space[4],
            }}
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: b.cardBgColor,
                borderRadius: b.radius.xl,
                padding: b.space[6],
                maxWidth: '400px',
                width: '100%',
                boxShadow: b.shadow.xl,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: b.space[3],
                marginBottom: b.space[4],
              }}>
                <div style={{
                  width: b.space[10],
                  height: b.space[10],
                  borderRadius: b.radius.md,
                  backgroundColor: b.errorLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <AlertCircle size={b.iconSize.xl} color={b.error} />
                </div>
                <h3 style={{
                  fontSize: b.fontSize.xl,
                  fontWeight: b.fontWeight.semibold,
                  color: b.textMain,
                  margin: 0,
                }}>
                  Session abbrechen?
                </h3>
              </div>
              <p style={{
                fontSize: b.fontSize.base,
                color: b.textSecondary,
                marginBottom: b.space[6],
                lineHeight: 1.5,
              }}>
                Alle eingegebenen Daten werden verworfen und nicht gespeichert.
              </p>
              <div style={{
                display: 'flex',
                gap: b.space[3],
                justifyContent: 'flex-end',
              }}>
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
                  style={{
                    backgroundColor: b.error,
                    color: b.white,
                  }}
                >
                  <X size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
                  Abbrechen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DecisionBoardInput;
