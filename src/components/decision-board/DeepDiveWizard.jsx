import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Check,
  MessageCircle,
  Wand2,
  Quote,
  SkipForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useBranding } from '@/hooks/useBranding';
import { generateWizardQuestion, extractWizardArguments } from '@/services/gemini';

/**
 * Generate unique ID for items
 */
const generateId = () => `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Weight Slider for extracted items
 */
const ExtractedItemSlider = ({ value, onChange, type, b }) => {
  const accentColor = type === 'pro' ? b.success : b.error;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], minWidth: '100px' }}>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '70px',
          height: '6px',
          borderRadius: b.radius.sm,
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${(value - 1) * 11.1}%, ${b.borderColor} ${(value - 1) * 11.1}%, ${b.borderColor} 100%)`,
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
      <span style={{
        minWidth: '24px',
        textAlign: 'center',
        fontWeight: b.fontWeight.semibold,
        fontSize: b.fontSize.sm,
        color: accentColor,
      }}>
        {value}
      </span>
    </div>
  );
};

/**
 * Extracted Item Card with checkbox and editable text
 */
const ExtractedItemCard = ({ item, onToggle, onWeightChange, onTextChange, b }) => {
  const isPro = item.type === 'pro';
  const bgColor = isPro ? b.successLight : b.errorLight;
  const borderColor = isPro ? '#bbf7d0' : '#fecaca';
  const iconColor = isPro ? b.successDark : b.errorDark;
  const textareaRef = React.useRef(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(36, textarea.scrollHeight) + 'px';
    }
  }, [item.text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: b.space[3],
        padding: b.space[4],
        backgroundColor: item.selected ? bgColor : b.cardBgHover,
        borderRadius: b.radius.lg,
        border: `2px solid ${item.selected ? borderColor : b.borderColor}`,
        transition: b.transition.normal,
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => onToggle(item.id)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: b.radius.md,
          border: `2px solid ${item.selected ? iconColor : b.borderColor}`,
          backgroundColor: item.selected ? iconColor : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          cursor: 'pointer',
          transition: b.transition.normal,
        }}
      >
        {item.selected && <Check size={14} color={b.white} strokeWidth={3} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: b.space[2], marginBottom: b.space[1] }}>
          {isPro ? (
            <ThumbsUp size={b.iconSize.md} color={iconColor} />
          ) : (
            <ThumbsDown size={b.iconSize.md} color={iconColor} />
          )}
          <span style={{
            fontSize: b.fontSize.xs,
            fontWeight: b.fontWeight.semibold,
            color: iconColor,
            textTransform: 'uppercase',
          }}>
            {isPro ? 'Pro' : 'Contra'}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={item.text}
          onChange={(e) => onTextChange(item.id, e.target.value)}
          style={{
            width: '100%',
            fontSize: b.fontSize.md,
            fontWeight: b.fontWeight.medium,
            color: b.textMain,
            marginBottom: b.space[2],
            padding: `${b.space[2]} ${b.space[2.5]}`,
            border: `1px solid ${borderColor}`,
            borderRadius: b.radius.md,
            backgroundColor: b.white,
            resize: 'none',
            overflow: 'hidden',
            minHeight: '36px',
            lineHeight: 1.4,
          }}
        />
        {item.source_quote && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: b.space[1.5],
            fontSize: b.fontSize.sm,
            color: b.textMuted,
            fontStyle: 'italic',
          }}>
            <Quote size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>"{item.source_quote}"</span>
          </div>
        )}
      </div>

      {/* Weight Slider */}
      <div onClick={(e) => e.stopPropagation()}>
        <ExtractedItemSlider
          value={item.weight}
          onChange={(weight) => onWeightChange(item.id, weight)}
          type={item.type}
          b={b}
        />
      </div>
    </motion.div>
  );
};

/**
 * Deep Dive Wizard Modal
 */
const DeepDiveWizard = ({
  isOpen,
  onClose,
  topic,
  existingPros,
  existingCons,
  onAddItems,
}) => {
  const b = useBranding();

  // Wizard state
  const [step, setStep] = useState('loading_question'); // loading_question | input | analyzing | selection
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [error, setError] = useState(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);

  // Load question when entering loading_question step
  useEffect(() => {
    if (!isOpen) return;

    if (step === 'loading_question') {
      loadQuestion();
    }
  }, [step, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('loading_question');
      setCurrentQuestion('');
      setUserAnswer('');
      setExtractedItems([]);
      setConversationHistory([]);
      setError(null);
      setQuestionsAsked(0);
    }
  }, [isOpen]);

  const loadQuestion = async () => {
    setError(null);
    try {
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      const result = await generateWizardQuestion(
        topic,
        existingPros,
        existingCons,
        conversationHistory,
        apiKey
      );

      setCurrentQuestion(result.question);
      setQuestionType(result.question_type || '');
      setStep('input');
      setQuestionsAsked(prev => prev + 1);
    } catch (err) {
      console.error('[DeepDiveWizard] Question generation error:', err);
      setError(err.message || 'Fehler beim Generieren der Frage');
      setStep('input'); // Show error in input view
    }
  };

  const handleAnalyze = async () => {
    if (!userAnswer.trim()) return;

    setStep('analyzing');
    setError(null);

    try {
      const apiKey = window.bewerbungstrainerConfig?.geminiApiKey;
      if (!apiKey) {
        throw new Error('API-Key nicht konfiguriert');
      }

      const result = await extractWizardArguments(
        topic,
        currentQuestion,
        userAnswer,
        apiKey
      );

      // Add IDs and selected state to extracted items
      const itemsWithIds = (result.extracted_items || []).map(item => ({
        ...item,
        id: generateId(),
        selected: true,
      }));

      setExtractedItems(itemsWithIds);

      // Add to conversation history
      setConversationHistory(prev => [...prev, {
        question: currentQuestion,
        answer: userAnswer,
      }]);

      setStep('selection');
    } catch (err) {
      console.error('[DeepDiveWizard] Extraction error:', err);
      setError(err.message || 'Fehler beim Analysieren der Antwort');
      setStep('input');
    }
  };

  const handleToggleItem = useCallback((id) => {
    setExtractedItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  }, []);

  const handleWeightChange = useCallback((id, weight) => {
    setExtractedItems(prev => prev.map(item =>
      item.id === id ? { ...item, weight } : item
    ));
  }, []);

  const handleTextChange = useCallback((id, text) => {
    setExtractedItems(prev => prev.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  }, []);

  const handleConfirmSelection = () => {
    const selectedItems = extractedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
    }

    // Reset for next question
    setUserAnswer('');
    setExtractedItems([]);
    setStep('loading_question');
  };

  const handleSkipToNextQuestion = () => {
    // Add to history even if no items extracted
    setConversationHistory(prev => [...prev, {
      question: currentQuestion,
      answer: userAnswer,
    }]);

    setUserAnswer('');
    setExtractedItems([]);
    setStep('loading_question');
  };

  const handleFinish = () => {
    const selectedItems = extractedItems.filter(item => item.selected);
    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: b.zIndex.modal,
          padding: b.space[4],
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="wizard-modal"
          style={{
            backgroundColor: b.cardBgColor,
            borderRadius: b.radius.xl,
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90dvh', // Use dvh for better mobile viewport handling
            overflow: 'hidden',
            boxShadow: b.shadow.xl,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${b.space[4]} ${b.space[5]}`,
            borderBottom: `1px solid ${b.borderColor}`,
            background: b.headerGradient,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: b.space[3] }}>
              <div style={{
                width: b.space[10],
                height: b.space[10],
                borderRadius: b.radius.lg,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Wand2 size={b.iconSize.xl} color={b.white} />
              </div>
              <div>
                <h2 style={{
                  fontSize: b.fontSize.xl,
                  fontWeight: b.fontWeight.bold,
                  color: b.white,
                  margin: 0,
                }}>
                  Deep Dive Interview
                </h2>
                <p style={{
                  fontSize: b.fontSize.sm,
                  color: 'rgba(255,255,255,0.8)',
                  margin: 0,
                }}>
                  Frage {questionsAsked} • Entdecke deine wahren Motive
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: b.space[10],
                height: b.space[10],
                borderRadius: b.radius.md,
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: b.white,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={b.iconSize.xl} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: b.space[5],
          }}>
            {/* Loading Question Step */}
            {step === 'loading_question' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: b.space[8],
                gap: b.space[4],
              }}>
                <Loader2
                  size={48}
                  color={b.primaryAccent}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                <p style={{ color: b.textSecondary, fontSize: b.fontSize.lg }}>
                  Generiere nächste Frage...
                </p>
              </div>
            )}

            {/* Input Step */}
            {step === 'input' && (
              <div>
                {/* Question Display */}
                <div style={{
                  backgroundColor: `${b.primaryAccent}10`,
                  borderRadius: b.radius.lg,
                  padding: b.space[5],
                  marginBottom: b.space[5],
                  borderLeft: `4px solid ${b.primaryAccent}`,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: b.space[2],
                    marginBottom: b.space[2],
                  }}>
                    <MessageCircle size={b.iconSize.md} color={b.primaryAccent} />
                    <span style={{
                      fontSize: b.fontSize.sm,
                      fontWeight: b.fontWeight.semibold,
                      color: b.primaryAccent,
                      textTransform: 'uppercase',
                    }}>
                      Coach fragt
                    </span>
                  </div>
                  <p style={{
                    fontSize: b.fontSize.xl,
                    fontWeight: b.fontWeight.medium,
                    color: b.textMain,
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {currentQuestion || 'Lade Frage...'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{
                    backgroundColor: b.errorLight,
                    color: b.errorDark,
                    padding: b.space[3],
                    borderRadius: b.radius.md,
                    marginBottom: b.space[4],
                    fontSize: b.fontSize.sm,
                  }}>
                    {error}
                  </div>
                )}

                {/* Answer Input */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: b.fontSize.base,
                    fontWeight: b.fontWeight.medium,
                    color: b.textSecondary,
                    marginBottom: b.space[2],
                  }}>
                    Deine Antwort
                  </label>
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Schreib einfach drauf los... Was fällt dir ein? Was fühlst du dabei?"
                    rows={5}
                    style={{
                      fontSize: b.fontSize.md,
                      padding: b.space[4],
                      borderRadius: b.radius.lg,
                      resize: 'vertical',
                      minHeight: '120px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Analyzing Step */}
            {step === 'analyzing' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: b.space[8],
                gap: b.space[4],
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={48} color={b.primaryAccent} />
                </motion.div>
                <p style={{ color: b.textSecondary, fontSize: b.fontSize.lg }}>
                  KI extrahiert Argumente...
                </p>
              </div>
            )}

            {/* Selection Step */}
            {step === 'selection' && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: b.space[2],
                  marginBottom: b.space[4],
                }}>
                  <Sparkles size={b.iconSize.lg} color={b.primaryAccent} />
                  <h3 style={{
                    fontSize: b.fontSize.lg,
                    fontWeight: b.fontWeight.semibold,
                    color: b.textMain,
                    margin: 0,
                  }}>
                    Extrahierte Argumente
                  </h3>
                </div>

                {extractedItems.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: b.space[6],
                    backgroundColor: b.cardBgHover,
                    borderRadius: b.radius.lg,
                  }}>
                    <p style={{ color: b.textSecondary, marginBottom: b.space[3] }}>
                      Keine konkreten Argumente gefunden.
                    </p>
                    <p style={{ color: b.textMuted, fontSize: b.fontSize.sm }}>
                      Das ist okay! Versuch es mit einer ausführlicheren Antwort oder einer anderen Frage.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: b.space[3] }}>
                    {extractedItems.map((item) => (
                      <ExtractedItemCard
                        key={item.id}
                        item={item}
                        onToggle={handleToggleItem}
                        onWeightChange={handleWeightChange}
                        onTextChange={handleTextChange}
                        b={b}
                      />
                    ))}
                  </div>
                )}

                <p style={{
                  fontSize: b.fontSize.sm,
                  color: b.textMuted,
                  marginTop: b.space[4],
                  textAlign: 'center',
                }}>
                  Klicke auf ein Argument um es ab-/anzuwählen. Passe die Gewichtung nach Bedarf an.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="wizard-footer" style={{
            padding: `${b.space[4]} ${b.space[5]}`,
            borderTop: `1px solid ${b.borderColor}`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: b.space[3],
            flexShrink: 0,
            backgroundColor: b.cardBgColor,
          }}>
            {step === 'input' && (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Abbrechen
                </Button>
                <div style={{ display: 'flex', gap: b.space[2] }}>
                  <Button
                    variant="outline"
                    onClick={handleSkipToNextQuestion}
                  >
                    <SkipForward size={b.iconSize.md} style={{ marginRight: b.space[1.5] }} />
                    Überspringen
                  </Button>
                  <Button
                    variant="solid"
                    onClick={handleAnalyze}
                    disabled={!userAnswer.trim() || userAnswer.length < 10}
                    style={{
                      background: userAnswer.trim().length >= 10 ? b.headerGradient : undefined,
                    }}
                  >
                    <Sparkles size={b.iconSize.md} style={{ marginRight: b.space[2] }} />
                    Auswerten
                  </Button>
                </div>
              </>
            )}

            {step === 'selection' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleFinish}
                  style={{
                    borderColor: b.borderColor,
                    backgroundColor: b.cardBgHover,
                  }}
                >
                  Fertig
                </Button>
                <Button
                  variant="solid"
                  onClick={extractedItems.length > 0 ? handleConfirmSelection : handleSkipToNextQuestion}
                  disabled={extractedItems.length > 0 && !extractedItems.some(i => i.selected)}
                  style={{
                    background: b.headerGradient,
                  }}
                >
                  {extractedItems.length > 0 ? 'Übernehmen & Weiter' : 'Nächste Frage'}
                  <ChevronRight size={b.iconSize.md} style={{ marginLeft: b.space[1] }} />
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          /* Mobile responsive: footer buttons stack on small screens */
          @media (max-width: 480px) {
            .wizard-modal {
              max-height: calc(100dvh - 16px) !important;
              border-radius: 16px !important;
            }
            .wizard-footer {
              padding: 12px 16px !important;
            }
            .wizard-footer > button,
            .wizard-footer > div {
              flex: 1 1 auto;
            }
            .wizard-footer > div {
              width: 100%;
              justify-content: stretch;
            }
            .wizard-footer > div > button {
              flex: 1;
            }
          }
        `}
      </style>
    </AnimatePresence>
  );
};

export default DeepDiveWizard;
