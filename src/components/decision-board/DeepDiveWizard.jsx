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
import { Button } from '@/components/ui/base/button';
import { Textarea } from '@/components/ui/base/textarea';
import { generateWizardQuestion, extractWizardArguments } from '@/services/gemini';

/**
 * Generate unique ID for items
 */
const generateId = () => `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Weight Slider for extracted items
 */
const ExtractedItemSlider = ({ value, onChange, type }) => {
  const isPro = type === 'pro';
  const accentColor = isPro ? '#22c55e' : '#ef4444';

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-[70px] h-1.5 rounded cursor-pointer appearance-none"
        style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor} ${(value - 1) * 11.1}%, #e2e8f0 ${(value - 1) * 11.1}%, #e2e8f0 100%)`,
        }}
      />
      <span className={`min-w-[24px] text-center font-semibold text-sm ${isPro ? 'text-green-600' : 'text-red-600'}`}>
        {value}
      </span>
    </div>
  );
};

/**
 * Extracted Item Card with checkbox and editable text
 */
const ExtractedItemCard = ({ item, onToggle, onWeightChange, onTextChange }) => {
  const isPro = item.type === 'pro';
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
      className={`flex flex-col sm:flex-row items-start gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all ${
        item.selected
          ? isPro
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Checkbox */}
      <div
        onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
          item.selected
            ? isPro
              ? 'border-green-600 bg-green-600'
              : 'border-red-600 bg-red-600'
            : 'border-slate-300 bg-transparent'
        }`}
      >
        {item.selected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center gap-2 mb-1">
          {isPro ? (
            <ThumbsUp size={16} className="text-green-600" />
          ) : (
            <ThumbsDown size={16} className="text-red-600" />
          )}
          <span className={`text-xs font-semibold uppercase ${isPro ? 'text-green-600' : 'text-red-600'}`}>
            {isPro ? 'Pro' : 'Contra'}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={item.text}
          onChange={(e) => onTextChange(item.id, e.target.value)}
          className={`w-full text-base font-medium text-slate-800 mb-2 px-2.5 py-2 border rounded-lg bg-white resize-none overflow-hidden min-h-[36px] leading-snug ${
            isPro ? 'border-green-200' : 'border-red-200'
          }`}
        />
        {item.source_quote && (
          <div className="flex items-start gap-1.5 text-sm text-slate-500 italic">
            <Quote size={12} className="shrink-0 mt-0.5" />
            <span>"{item.source_quote}"</span>
          </div>
        )}
      </div>

      {/* Weight Slider */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0 self-center sm:self-start">
        <ExtractedItemSlider
          value={item.weight}
          onChange={(weight) => onWeightChange(item.id, weight)}
          type={item.type}
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
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-[640px] max-h-[90dvh] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-brand-gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Wand2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white m-0">
                  Deep Dive Interview
                </h2>
                <p className="text-sm text-white/80 m-0">
                  Frage {questionsAsked} • Entdecke deine wahren Motive
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg border-none bg-white/20 text-white cursor-pointer flex items-center justify-center hover:bg-white/30 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            {/* Loading Question Step */}
            {step === 'loading_question' && (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-4">
                <Loader2
                  size={48}
                  className="text-primary animate-spin"
                />
                <p className="text-slate-500 text-lg">
                  Generiere nächste Frage...
                </p>
              </div>
            )}

            {/* Input Step */}
            {step === 'input' && (
              <div>
                {/* Question Display */}
                <div className="bg-primary/10 rounded-xl p-4 sm:p-5 mb-5 border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-primary uppercase">
                      Coach fragt
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-medium text-slate-800 leading-relaxed m-0">
                    {currentQuestion || 'Lade Frage...'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {/* Answer Input */}
                <div>
                  <label className="block text-base font-medium text-slate-500 mb-2">
                    Deine Antwort
                  </label>
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Schreib einfach drauf los... Was fällt dir ein? Was fühlst du dabei?"
                    rows={5}
                    className="text-base p-4 rounded-xl resize-y min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {/* Analyzing Step */}
            {step === 'analyzing' && (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={48} className="text-primary" />
                </motion.div>
                <p className="text-slate-500 text-lg">
                  KI extrahiert Argumente...
                </p>
              </div>
            )}

            {/* Selection Step */}
            {step === 'selection' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-primary" />
                  <h3 className="text-lg font-semibold text-slate-800 m-0">
                    Extrahierte Argumente
                  </h3>
                </div>

                {extractedItems.length === 0 ? (
                  <div className="text-center py-8 sm:py-10 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 mb-3">
                      Keine konkreten Argumente gefunden.
                    </p>
                    <p className="text-slate-400 text-sm">
                      Das ist okay! Versuch es mit einer ausführlicheren Antwort oder einer anderen Frage.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {extractedItems.map((item) => (
                      <ExtractedItemCard
                        key={item.id}
                        item={item}
                        onToggle={handleToggleItem}
                        onWeightChange={handleWeightChange}
                        onTextChange={handleTextChange}
                      />
                    ))}
                  </div>
                )}

                <p className="text-sm text-slate-400 mt-4 text-center">
                  Klicke auf ein Argument um es ab-/anzuwählen. Passe die Gewichtung nach Bedarf an.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-200 flex flex-wrap justify-between gap-3 shrink-0 bg-white">
            {step === 'input' && (
              <>
                <Button variant="ghost" onClick={onClose} className="order-1">
                  Abbrechen
                </Button>
                <div className="flex gap-2 order-2 flex-1 sm:flex-none justify-end">
                  <Button
                    variant="outline"
                    onClick={handleSkipToNextQuestion}
                    className="flex-1 sm:flex-none"
                  >
                    <SkipForward size={16} className="mr-1.5" />
                    <span className="hidden sm:inline">Überspringen</span>
                    <span className="sm:hidden">Skip</span>
                  </Button>
                  <Button
                    variant="solid"
                    onClick={handleAnalyze}
                    disabled={!userAnswer.trim() || userAnswer.length < 10}
                    className={`flex-1 sm:flex-none ${userAnswer.trim().length >= 10 ? 'bg-brand-gradient' : ''}`}
                  >
                    <Sparkles size={16} className="mr-2" />
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
                  className="order-1"
                >
                  Fertig
                </Button>
                <Button
                  variant="solid"
                  onClick={() => {
                    const selectedItems = extractedItems.filter(i => i.selected);
                    if (selectedItems.length > 0) {
                      handleConfirmSelection();
                    } else {
                      handleSkipToNextQuestion();
                    }
                  }}
                  className="bg-brand-gradient order-2"
                >
                  {extractedItems.some(i => i.selected) ? (
                    <>
                      <span className="hidden sm:inline">Übernehmen & Weiter</span>
                      <span className="sm:hidden">Weiter</span>
                    </>
                  ) : (
                    'Nächste Frage'
                  )}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            border: 2px solid currentColor;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }

          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            border: 2px solid currentColor;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
        `}
      </style>
    </AnimatePresence>
  );
};

export default DeepDiveWizard;
