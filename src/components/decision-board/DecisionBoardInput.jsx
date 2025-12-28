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
import { usePartner } from '@/context/PartnerContext';
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
const WeightSlider = ({ value, onChange, color }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px', width: '100px' }}>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(90deg, ${color === 'green' ? '#22c55e' : '#ef4444'} 0%, ${color === 'green' ? '#22c55e' : '#ef4444'} ${(value - 1) * 11.1}%, #e2e8f0 ${(value - 1) * 11.1}%, #e2e8f0 100%)`,
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          minWidth: '28px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '13px',
          color: color === 'green' ? '#16a34a' : '#dc2626',
          backgroundColor: color === 'green' ? '#dcfce7' : '#fee2e2',
          padding: '2px 6px',
          borderRadius: '6px',
        }}
      >
        {value}
      </span>
    </div>
  );
};

/**
 * Decision Item Component - Mobile responsive
 */
const DecisionItem = ({ item, onUpdate, onDelete, onAddNew, color, autoFocus }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Only add new line if current has some text
      if (item.text.trim()) {
        onAddNew();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: color === 'green' ? -20 : 20 }}
      transition={{ duration: 0.2 }}
      className="decision-item"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        backgroundColor: color === 'green' ? '#f0fdf4' : '#fef2f2',
        borderRadius: '12px',
        border: `1px solid ${color === 'green' ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <Input
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        placeholder={color === 'green' ? 'Pro-Argument...' : 'Contra-Argument...'}
        style={{
          flex: '1 1 200px',
          minWidth: '0',
          backgroundColor: 'white',
          border: `1px solid ${color === 'green' ? '#86efac' : '#fca5a5'}`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <WeightSlider
          value={item.weight}
          onChange={(weight) => onUpdate(item.id, { weight })}
          color={color}
        />
        <button
          onClick={() => onDelete(item.id)}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
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
    <div style={{ marginTop: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        <span style={{ color: '#16a34a' }}>Pro: {proScore} Punkte ({proPercentage}%)</span>
        <span style={{ color: '#dc2626' }}>Contra: {contraScore} Punkte ({contraPercentage}%)</span>
      </div>
      <div style={{
        height: '24px',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: '#f1f5f9',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${proPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px',
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
            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px',
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
const SuggestionCard = ({ suggestion, onAdd, isAdded }) => {
  const isPro = suggestion.type === 'pro';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: isPro ? '#f0fdf4' : '#fef2f2',
        borderRadius: '10px',
        border: `1px solid ${isPro ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        backgroundColor: isPro ? '#dcfce7' : '#fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isPro ? (
          <ThumbsUp size={14} color="#16a34a" />
        ) : (
          <ThumbsDown size={14} color="#dc2626" />
        )}
      </div>
      <span style={{
        flex: 1,
        fontSize: '14px',
        color: '#334155',
        lineHeight: 1.4,
      }}>
        {suggestion.text}
      </span>
      <button
        onClick={() => onAdd(suggestion)}
        disabled={isAdded}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isAdded ? '#e2e8f0' : (isPro ? '#22c55e' : '#ef4444'),
          color: isAdded ? '#94a3b8' : 'white',
          cursor: isAdded ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {isAdded ? '✓' : <Plus size={18} color="white" strokeWidth={3} />}
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
  addedSuggestions,
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
        marginTop: '16px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `2px solid ${persona?.color || '#6366f1'}`,
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingRight: '32px',
      }}>
        <span style={{ fontSize: '28px' }}>{persona?.icon}</span>
        <div>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
          }}>
            {persona?.name}
          </h4>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
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
          gap: '12px',
          padding: '24px',
        }}>
          <Loader2
            size={32}
            color={persona?.color}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <span style={{ color: '#64748b', fontSize: '14px' }}>
            {persona?.name} denkt nach...
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Pro suggestions */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#16a34a',
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
              />
            ))}

          {/* Contra suggestions */}
          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#dc2626',
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
              />
            ))}
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
  addedSuggestions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed to save space on mobile
  const hasTopic = topic.trim().length > 0;

  return (
    <Card variant="elevated" padding="md" style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: '8px',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#1e293b',
              margin: 0,
            }}>
              Brainstorming
            </h3>
            <p style={{
              fontSize: '13px',
              color: '#64748b',
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
          <ChevronUp size={20} color="#64748b" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={20} color="#64748b" style={{ flexShrink: 0 }} />
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
            <div style={{ marginTop: '16px' }}>
              {/* Persona Buttons - horizontal scroll on mobile */}
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginLeft: '-4px',
                marginRight: '-4px',
                paddingLeft: '4px',
                paddingRight: '4px',
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
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: activePersona === persona.id
                        ? `2px solid ${persona.color}`
                        : '2px solid #e2e8f0',
                      backgroundColor: activePersona === persona.id
                        ? persona.bgColor
                        : 'white',
                      cursor: hasTopic ? 'pointer' : 'not-allowed',
                      opacity: hasTopic ? 1 : 0.5,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isLoading && activePersona === persona.id ? (
                      <Loader2
                        size={16}
                        color={persona.color}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : (
                      <span style={{ fontSize: '16px' }}>{persona.icon}</span>
                    )}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: activePersona === persona.id ? persona.color : '#475569',
                    }}>
                      {persona.name.replace('Der ', '').replace('Dein ', '')}
                    </span>
                  </button>
                ))}
              </div>

              {!hasTopic && (
                <p style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: '#94a3b8',
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
  isAuthenticated,
  requireAuth,
}) => {
  const { branding } = usePartner();

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

      const result = await brainstormArguments(topic, personaId, apiKey);

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
  }, [topic]);

  const handleCloseBrainstorm = useCallback(() => {
    setBrainstormState({
      activePersona: null,
      isLoading: false,
      suggestions: [],
    });
  }, []);

  const handleAddSuggestion = useCallback((suggestion) => {
    const suggestionKey = `${suggestion.type}-${suggestion.text}`;

    // Mark as added
    setAddedSuggestions(prev => new Set([...prev, suggestionKey]));

    // Add to appropriate list
    const newItem = {
      id: generateId(),
      text: suggestion.text,
      weight: 5, // Default weight for AI suggestions
    };

    if (suggestion.type === 'pro') {
      setPros(prev => [...prev, newItem]);
    } else {
      setCons(prev => [...prev, newItem]);
    }
  }, []);

  // Handle audio transcript - append to context
  const handleTranscriptReady = useCallback((transcript) => {
    setContext(prev => {
      // If there's existing text, add a space or newline before appending
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

      // Filter out empty items
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

  const primaryColor = branding?.['--primary-accent'] || '#4A9EC9';

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header - responsive */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`,
          marginBottom: '12px',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
        }}>
          <Scale size={28} color="white" />
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '6px',
        }}>
          Der Entscheidungs-Kompass
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 8px',
        }}>
          Analysiere deine Entscheidung objektiv. Gewichte Pro und Contra,
          und erhalte KI-gestützte Impulse für blinde Flecken.
        </p>
      </div>

      {/* Decision Question */}
      <Card variant="elevated" padding="md" style={{ marginBottom: '16px' }}>
        <CardHeader>
          <CardTitle icon={Lightbulb} size="md">
            Deine Entscheidungsfrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Soll ich das Jobangebot annehmen?"
            style={{
              fontSize: '16px',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
          />

          {/* Context / Situation Description */}
          <div style={{ marginTop: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#64748b',
              marginBottom: '8px',
            }}>
              Beschreibe die Situation (optional)
            </label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Hintergrund, Rahmenbedingungen, Gefühle, was dich beschäftigt..."
              rows={3}
              style={{
                fontSize: '15px',
                padding: '12px 16px',
                borderRadius: '12px',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />

            {/* Audio Recorder for voice input */}
            <div style={{ marginTop: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: '8px',
              }}>
                Oder per Spracheingabe:
              </label>
              <AudioRecorder onTranscriptReady={handleTranscriptReady} />
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
        addedSuggestions={addedSuggestions}
      />

      {/* Pro/Contra Split - responsive grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Pro Column */}
        <Card variant="elevated" padding="lg" style={{ borderTop: '4px solid #22c55e' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ThumbsUp size={20} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#16a34a', margin: 0 }}>
                  PRO
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  Was spricht dafür?
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {pros.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updatePro}
                    onDelete={deletePro}
                    onAddNew={addPro}
                    color="green"
                    autoFocus={focusedItemId === item.id}
                  />
                ))}
              </AnimatePresence>
              <Button
                variant="outline"
                onClick={addPro}
                style={{
                  borderColor: '#22c55e',
                  color: '#16a34a',
                  borderStyle: 'dashed',
                }}
              >
                <Plus size={18} style={{ marginRight: '8px' }} />
                Argument hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contra Column */}
        <Card variant="elevated" padding="lg" style={{ borderTop: '4px solid #ef4444' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ThumbsDown size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#dc2626', margin: 0 }}>
                  CONTRA
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  Was spricht dagegen?
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence mode="popLayout">
                {cons.map((item) => (
                  <DecisionItem
                    key={item.id}
                    item={item}
                    onUpdate={updateCon}
                    onDelete={deleteCon}
                    onAddNew={addCon}
                    color="red"
                    autoFocus={focusedItemId === item.id}
                  />
                ))}
              </AnimatePresence>
              <Button
                variant="outline"
                onClick={addCon}
                style={{
                  borderColor: '#ef4444',
                  color: '#dc2626',
                  borderStyle: 'dashed',
                }}
              >
                <Plus size={18} style={{ marginRight: '8px' }} />
                Argument hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Bar */}
      {(hasValidPros || hasValidCons) && (
        <Card variant="elevated" padding="lg" style={{ marginBottom: '24px' }}>
          <CardHeader>
            <CardTitle icon={Scale} size="md">
              Rationaler Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RationalScoreBar proScore={proScore} contraScore={contraScore} />
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
            gap: '12px',
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            marginBottom: '24px',
            color: '#dc2626',
          }}
        >
          <AlertCircle size={20} />
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
            padding: '16px 32px',
            fontSize: '18px',
            background: canAnalyze
              ? `linear-gradient(135deg, ${primaryColor} 0%, #7C3AED 100%)`
              : undefined,
            boxShadow: canAnalyze ? '0 8px 24px rgba(124, 58, 237, 0.3)' : undefined,
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={22} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} />
              Analyse läuft...
            </>
          ) : (
            <>
              <Sparkles size={22} style={{ marginRight: '10px' }} />
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
    </div>
  );
};

export default DecisionBoardInput;
