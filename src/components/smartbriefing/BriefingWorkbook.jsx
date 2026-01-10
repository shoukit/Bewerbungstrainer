/**
 * BriefingWorkbook - Interactive briefing display with editable notes
 *
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartner } from '@/context/PartnerContext';
import { useMobile } from '@/hooks/useMobile';
import wordpressAPI from '@/services/wordpress-api';
import { formatDateTime } from '@/utils/formatting';
import { getIcon } from '@/utils/iconMaps';
import { Button, Card } from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Save,
  Check,
  Loader2,
  Sparkles,
  PenLine,
  Bot,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  FileText,
  Download,
  MessageCircle,
  HelpCircle,
  BookOpen,
  Rocket,
  Send,
  Plus,
  X,
  Presentation,
} from 'lucide-react';
import PresentationExportDialog from './PresentationExportDialog';
import { generatePresentationFromBriefing } from '@/services/presentation-generator';

// ============================================================================
// HELPER: Parse bullet points from AI answer
// ============================================================================

/**
 * Extract individual bullet points/action items from AI response text
 * Returns objects with label (clean, no markdown) and content (description)
 */
const parseActionPoints = (text) => {
  if (!text) return [];

  const lines = text.split('\n');
  const actionPoints = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to extract content from different formats
    let content = null;

    // Format 1: Bullet point (*, -, •)
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.+)$/);
    if (bulletMatch) {
      content = bulletMatch[1].trim();
    }

    // Format 2: Numbered list (1., 2., etc.)
    const numberedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
    if (!content && numberedMatch) {
      content = numberedMatch[1].trim();
    }

    // Format 3: Line starting with **Bold:** (no bullet)
    const directBoldMatch = trimmed.match(/^\*\*([^*]+)\*\*:?\s*(.+)$/);
    if (!content && directBoldMatch) {
      content = trimmed; // Use the whole line
    }

    if (content) {
      // Try to extract bold label: **Label:** rest or **Label** rest
      const boldMatch = content.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
      if (boldMatch && boldMatch[1]) {
        const label = boldMatch[1].trim();
        const description = boldMatch[2]?.trim() || '';
        actionPoints.push({
          id: `ap-${actionPoints.length}`,
          label: label,
          content: description,
        });
      } else {
        // No bold label - create a short label from the content
        // Remove any remaining markdown asterisks
        const cleanContent = content.replace(/\*\*/g, '').replace(/\*/g, '');
        const words = cleanContent.split(/\s+/);
        const shortLabel = words.slice(0, 4).join(' ');
        actionPoints.push({
          id: `ap-${actionPoints.length}`,
          label: shortLabel.length > 40 ? shortLabel.substring(0, 40) + '...' : shortLabel,
          content: cleanContent,
        });
      }
    }
  }

  return actionPoints;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIABLE_DISPLAY_NAMES = {
  role_name: 'Position',
  position: 'Position',
  target_company: 'Unternehmen',
  company: 'Unternehmen',
  interview_type: 'Gesprächsart',
  karrierelevel: 'Karrierelevel',
  experience_years: 'Berufserfahrung',
  industry: 'Branche',
  current_salary: 'Aktuelles Gehalt',
  target_salary: 'Zielgehalt',
  negotiation_context: 'Verhandlungskontext',
  customer_name: 'Kunde',
  meeting_goal: 'Gesprächsziel',
  product_service: 'Produkt/Service',
  user_name: 'Name',
  skills: 'Fähigkeiten',
  strengths: 'Stärken',
  challenges: 'Herausforderungen',
};

const getVariableDisplayName = (key) => {
  return VARIABLE_DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// ============================================================================
// MARKDOWN HELPERS
// ============================================================================

/**
 * Render inline markdown (bold, italic, code)
 */
const renderInlineMarkdown = (text) => {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    const matches = [
      { match: boldMatch, type: 'bold' },
      { match: italicMatch, type: 'italic' },
      { match: codeMatch, type: 'code' },
    ].filter(m => m.match);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const earliest = matches.reduce((a, b) =>
      (a.match?.index ?? Infinity) < (b.match?.index ?? Infinity) ? a : b
    );

    if (earliest.match.index > 0) {
      parts.push(remaining.substring(0, earliest.match.index));
    }

    switch (earliest.type) {
      case 'bold':
        parts.push(
          <strong key={key++} className="font-semibold text-slate-900">
            {earliest.match[1]}
          </strong>
        );
        break;
      case 'italic':
        parts.push(
          <em key={key++} className="italic">
            {earliest.match[1] || earliest.match[2]}
          </em>
        );
        break;
      case 'code':
        parts.push(
          <code key={key++} className="bg-indigo-50 px-1.5 py-0.5 rounded text-[13px] font-mono text-indigo-700">
            {earliest.match[1]}
          </code>
        );
        break;
    }

    remaining = remaining.substring(earliest.match.index + earliest.match[0].length);
  }

  return parts;
};

/**
 * Simple Markdown Renderer (for legacy content)
 */
const MarkdownContent = ({ content }) => {
  if (!content) return null;

  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-2 pl-5 list-none">
            {currentList.map((item, idx) => (
              <li key={idx} className="mb-1.5 text-sm leading-relaxed text-slate-700 relative pl-4">
                <span className="absolute left-0 text-indigo-600 font-bold">
                  {listType === 'number' ? `${idx + 1}.` : '•'}
                </span>
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushList();
        return;
      }

      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(trimmedLine.substring(2));
        return;
      }

      const numberMatch = trimmedLine.match(/^(\d+)\.\s/);
      if (numberMatch) {
        if (listType !== 'number') {
          flushList();
          listType = 'number';
        }
        currentList.push(trimmedLine.substring(numberMatch[0].length));
        return;
      }

      flushList();
      elements.push(
        <p key={`p-${index}`} className="my-2 text-sm leading-relaxed text-slate-700">
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return <div>{renderMarkdown(content)}</div>;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Deleted Item Row - Compact display for deleted items with restore option
 */
const DeletedItemRow = ({ item, onRestore }) => (
  <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-2 flex items-center justify-between opacity-60">
    <span className="text-sm text-slate-500 italic">
      <s>{item.label}</s> - gelöscht
    </span>
    <button
      onClick={onRestore}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-none bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-all"
    >
      <RotateCcw size={12} />
      Wiederherstellen
    </button>
  </div>
);

/**
 * ExplanationCard - Collapsible AI explanation with individual action points
 */
const ExplanationCard = ({ explanation, onDelete, onAddAsItem, onAddActionPoint, itemLabel }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Initially expanded
  const [addedPointIds, setAddedPointIds] = useState(new Set()); // Track added points
  const actionPoints = parseActionPoints(explanation.answer);

  // Filter out points that have already been added
  const availablePoints = actionPoints.filter(point => !addedPointIds.has(point.id));

  const handleAddPoint = (point) => {
    onAddActionPoint(point);
    setAddedPointIds(prev => new Set([...prev, point.id]));
  };

  const getTitle = () => {
    if (explanation.quick_action) {
      switch (explanation.quick_action) {
        case 'explain': return '💡 Erklärung';
        case 'examples': return '📝 Beispiele';
        case 'howto': return '🚀 Umsetzung';
        default: return 'Frage';
      }
    }
    return `❓ ${explanation.question}`;
  };

  // Truncate answer for preview (first 100 chars)
  const previewText = explanation.answer?.length > 100
    ? explanation.answer.substring(0, 100) + '...'
    : explanation.answer;

  return (
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 bg-transparent border-none cursor-pointer flex items-center gap-2 text-left hover:bg-amber-50/50 transition-colors"
      >
        <ChevronRight
          size={14}
          className={`text-amber-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-[12px] font-medium text-amber-700 flex-1 truncate">
          {getTitle()}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {onAddAsItem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddAsItem(explanation.answer, itemLabel);
              }}
              title="Gesamten Block als neuen Punkt hinzufügen"
              className="p-1 rounded bg-transparent border-none text-slate-400 cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(explanation.id);
            }}
            title="Erklärung löschen"
            className="p-1 rounded bg-transparent border-none text-slate-400 cursor-pointer hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </button>

      {/* Preview when collapsed */}
      {!isExpanded && (
        <div className="px-3 pb-2.5 pt-0">
          <p className="text-[12px] text-slate-500 m-0 line-clamp-2">
            {previewText}
          </p>
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-amber-100">
              {/* Full answer text */}
              <div className="text-[13px] text-slate-600 whitespace-pre-wrap mt-2.5 leading-relaxed">
                {renderInlineMarkdown(explanation.answer)}
              </div>

              {/* Individual action points to add */}
              {actionPoints.length > 0 && onAddActionPoint && (
                <div className="mt-3 pt-3 border-t border-amber-100">
                  <p className="text-[11px] font-medium text-amber-700 mb-2 flex items-center gap-1">
                    <Plus size={12} />
                    Einzelne Punkte hinzufügen:
                    {addedPointIds.size > 0 && (
                      <span className="text-green-600 ml-1">
                        ({addedPointIds.size} hinzugefügt)
                      </span>
                    )}
                  </p>
                  {availablePoints.length > 0 ? (
                    <div className="space-y-2">
                      {availablePoints.map((point) => (
                        <div
                          key={point.id}
                          className="p-2.5 bg-white rounded-xl border border-amber-100 hover:border-amber-200 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            {/* Bullet point */}
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[13px] font-semibold text-slate-800 m-0 mb-0.5 leading-snug">
                                {point.label}
                              </h5>
                              {point.content && (
                                <p className="text-[12px] text-slate-600 m-0 leading-snug">
                                  {point.content.length > 150 ? point.content.substring(0, 150) + '...' : point.content}
                                </p>
                              )}
                            </div>
                            {/* Add button */}
                            <button
                              onClick={() => handleAddPoint(point)}
                              title="Diesen Punkt zur Liste hinzufügen"
                              className="p-1.5 rounded-lg bg-transparent border-none text-amber-600 cursor-pointer hover:text-white hover:bg-indigo-500 transition-all opacity-60 group-hover:opacity-100 flex-shrink-0"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-green-600 italic m-0">
                      ✓ Alle Punkte wurden hinzugefügt
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Item Card Component - Individual briefing item with note, AI help, and delete
 */
const ItemCard = ({ item, sectionId, onUpdateItem, onAskItem, onDeleteExplanation, onAddAsItem, onAddActionPoint }) => {
  const [note, setNote] = useState(item.user_note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNoteField, setShowNoteField] = useState(!!item.user_note);

  // AI Help states
  const [showAiHelp, setShowAiHelp] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);

  const explanations = item.ai_explanations || [];

  useEffect(() => {
    setHasChanges(note !== (item.user_note || ''));
  }, [note, item.user_note]);

  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      await onUpdateItem(sectionId, item.id, { user_note: note });
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onUpdateItem(sectionId, item.id, { deleted: true });
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleRestore = async () => {
    try {
      await onUpdateItem(sectionId, item.id, { deleted: false });
    } catch (err) {
      console.error('Error restoring item:', err);
    }
  };

  const handleQuickAction = async (action) => {
    if (!onAskItem) return;
    setIsAsking(true);
    try {
      await onAskItem(sectionId, item.id, { quick_action: action });
      setShowExplanations(true);
    } catch (err) {
      console.error('Error asking AI:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCustomQuestion = async () => {
    if (!onAskItem || !customQuestion.trim()) return;
    setIsAsking(true);
    try {
      await onAskItem(sectionId, item.id, { question: customQuestion.trim() });
      setCustomQuestion('');
      setShowExplanations(true);
    } catch (err) {
      console.error('Error asking AI:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDeleteExplanation = async (explanationId) => {
    if (!onDeleteExplanation) return;
    try {
      await onDeleteExplanation(sectionId, item.id, explanationId);
    } catch (err) {
      console.error('Error deleting explanation:', err);
    }
  };

  if (item.deleted) {
    return <DeletedItemRow item={item} onRestore={handleRestore} />;
  }

  return (
    <Card className="mb-2.5 overflow-hidden p-0 hover:shadow-md transition-shadow">
      {/* Item Header */}
      <div className="p-3.5 flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-slate-900 m-0">
              {item.label}
            </h4>
          </div>
          {item.content && (
            <p className="text-[13px] text-slate-600 m-0 ml-3.5 leading-snug">
              {renderInlineMarkdown(item.content)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {explanations.length > 0 && !showAiHelp && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {explanations.length} KI
            </span>
          )}
          {item.user_note && !showNoteField && (
            <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Notiz
            </span>
          )}
          <button
            onClick={() => {
              setShowAiHelp(!showAiHelp);
              if (!showAiHelp) setShowNoteField(false);
            }}
            title="KI-Hilfe"
            className={`p-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center transition-all ${
              showAiHelp
                ? 'bg-amber-100 text-amber-600'
                : 'bg-transparent text-slate-400 hover:text-amber-600 hover:bg-amber-50'
            }`}
          >
            <MessageCircle size={16} />
          </button>
          <button
            onClick={() => {
              setShowNoteField(!showNoteField);
              if (!showNoteField) setShowAiHelp(false);
            }}
            title="Notiz hinzufügen"
            className={`p-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center transition-all ${
              showNoteField
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-transparent text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <PenLine size={16} />
          </button>
          <button
            onClick={handleDelete}
            title="Löschen"
            className="p-1.5 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* AI Help Panel (collapsible) */}
      {showAiHelp && (
        <div className="px-3.5 py-3 bg-amber-50 border-t border-amber-100">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handleQuickAction('explain')}
              disabled={isAsking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 text-[12px] font-medium cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              <HelpCircle size={14} />
              Erkläre genauer
            </button>
            <button
              onClick={() => handleQuickAction('examples')}
              disabled={isAsking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 text-[12px] font-medium cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              <BookOpen size={14} />
              Beispiele
            </button>
            <button
              onClick={() => handleQuickAction('howto')}
              disabled={isAsking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 text-[12px] font-medium cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              <Rocket size={14} />
              Wie umsetzen?
            </button>
          </div>

          {/* Custom Question Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAsking && handleCustomQuestion()}
              placeholder="Oder stelle eine eigene Frage..."
              disabled={isAsking}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              className="flex-1 px-3 py-2 rounded-xl border border-amber-200 text-[13px] text-slate-700 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-50"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCustomQuestion}
              disabled={isAsking || !customQuestion.trim()}
              icon={isAsking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              className="bg-amber-500 hover:bg-amber-600 border-amber-500"
            >
              Fragen
            </Button>
          </div>

          {/* Loading State */}
          {isAsking && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 text-[13px]">
              <Loader2 size={14} className="animate-spin" />
              KI denkt nach...
            </div>
          )}

          {/* Existing Explanations - Collapsible Cards */}
          {explanations.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="flex items-center gap-1 text-[12px] font-medium text-amber-700 bg-transparent border-none cursor-pointer mb-2"
              >
                {showExplanations ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                KI-Erklärungen ({explanations.length})
              </button>

              {showExplanations && (
                <div className="space-y-2">
                  {explanations.map((exp) => (
                    <ExplanationCard
                      key={exp.id}
                      explanation={exp}
                      itemLabel={item.label}
                      onDelete={handleDeleteExplanation}
                      onAddAsItem={onAddAsItem ? (answer, label) => onAddAsItem(sectionId, answer, label) : null}
                      onAddActionPoint={onAddActionPoint ? (point) => onAddActionPoint(sectionId, point, item.label) : null}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note Field (collapsible) */}
      {showNoteField && (
        <div className="px-3.5 py-3 bg-slate-50 border-t border-slate-100">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Deine Notiz zu diesem Punkt..."
            className="w-full min-h-[60px] p-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 resize-y outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="flex justify-end mt-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowNoteField(false);
                setNote(item.user_note || '');
              }}
            >
              Abbrechen
            </Button>
            <Button
              variant={saveSuccess ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleSaveNote}
              disabled={isSaving || !hasChanges}
              icon={isSaving ? <Loader2 size={12} className="animate-spin" /> : saveSuccess ? <Check size={12} /> : <Save size={12} />}
              className={saveSuccess ? 'bg-green-100 text-green-700 border-green-200' : ''}
            >
              {saveSuccess ? 'Gespeichert!' : 'Speichern'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * Generate More Button - Dashed button to generate additional items
 */
const GenerateMoreButton = ({ onClick, isGenerating }) => (
  <button
    onClick={onClick}
    disabled={isGenerating}
    className={`flex items-center justify-center gap-2 w-full py-3 px-4 mt-3 mb-2 rounded-xl
      border-2 border-dashed border-indigo-200 bg-indigo-50 text-indigo-600 text-[13px] font-medium
      cursor-pointer transition-all
      hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-sm
      disabled:cursor-wait disabled:opacity-60`}
  >
    {isGenerating ? (
      <>
        <Loader2 size={16} className="animate-spin" />
        Generiere 5 weitere Punkte...
      </>
    ) : (
      <>
        <Sparkles size={16} />
        5 weitere Punkte generieren
      </>
    )}
  </button>
);

/**
 * Section Card Component - Handles both item-based and legacy markdown content
 */
const SectionCard = ({ section, onUpdateItem, onGenerateMore, onAskItem, onDeleteExplanation, onAddAsItem, onAddActionPoint, isExpanded, onToggle }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    try {
      await onGenerateMore(section.id);
    } catch (err) {
      console.error('Error generating more items:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse ai_content to check if it's JSON with items
  const parseContent = useCallback(() => {
    if (!section.ai_content) return { type: 'empty', items: [], content: '' };

    try {
      const parsed = JSON.parse(section.ai_content);
      if (parsed && Array.isArray(parsed.items)) {
        return { type: 'items', items: parsed.items, content: '' };
      }
    } catch {
      // Not JSON, treat as markdown
    }

    return { type: 'markdown', items: [], content: section.ai_content };
  }, [section.ai_content]);

  const { type, items, content } = parseContent();
  const visibleItems = items.filter(item => !item.deleted);
  const deletedItems = items.filter(item => item.deleted);
  const hasNotes = items.some(item => item.user_note && !item.deleted);

  return (
    <Card className="mb-4 overflow-hidden p-0 hover:shadow-lg transition-shadow">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className={`w-full px-5 py-4 flex items-start justify-between gap-2 border-none bg-transparent cursor-pointer ${
          isExpanded ? 'border-b border-slate-100' : ''
        }`}
      >
        <h3 className="text-lg font-semibold text-slate-900 m-0 text-left flex-1 min-w-0 break-words leading-snug">
          {section.section_title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {type === 'items' && (
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {visibleItems.length} Punkte
            </span>
          )}
          {hasNotes && (
            <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              <PenLine size={12} />
              Notizen
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={20} className="text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 py-4">
          {type === 'items' ? (
            <>
              {/* Items list */}
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  onUpdateItem={onUpdateItem}
                  onAskItem={onAskItem}
                  onDeleteExplanation={onDeleteExplanation}
                  onAddAsItem={onAddAsItem}
                  onAddActionPoint={onAddActionPoint}
                />
              ))}

              {/* Generate more button */}
              {onGenerateMore && (
                <GenerateMoreButton onClick={handleGenerateMore} isGenerating={isGenerating} />
              )}

              {/* Deleted items */}
              {deletedItems.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                    <Trash2 size={12} />
                    {deletedItems.length} gelöschte {deletedItems.length === 1 ? 'Punkt' : 'Punkte'}
                  </div>
                  {deletedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      onUpdateItem={onUpdateItem}
                      onAskItem={onAskItem}
                      onDeleteExplanation={onDeleteExplanation}
                      onAddAsItem={onAddAsItem}
                      onAddActionPoint={onAddActionPoint}
                    />
                  ))}
                </div>
              )}
            </>
          ) : type === 'markdown' ? (
            /* Legacy markdown content */
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                  KI-Empfehlung
                </span>
              </div>
              <MarkdownContent content={content} />
            </div>
          ) : (
            <p className="text-slate-400 italic">Kein Inhalt verfügbar</p>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * Header Action Button - Icon button for header actions
 */
const HeaderActionButton = ({ onClick, disabled, loading, icon: Icon, danger, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center justify-center rounded-xl px-3 py-2.5 border cursor-pointer outline-none transition-all
      ${danger
        ? 'bg-red-500/20 border-red-500/40 text-white hover:bg-red-500/30 hover:shadow-lg'
        : 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:shadow-lg'
      }
      disabled:opacity-60 disabled:cursor-not-allowed`}
  >
    {loading ? (
      <Loader2 size={16} className="animate-spin" />
    ) : (
      <Icon size={16} />
    )}
  </button>
);

/**
 * Variables Panel - Collapsible display of briefing variables
 */
const VariablesPanel = ({ variables, isExpanded, onToggle }) => {
  if (!variables || Object.keys(variables).length === 0) return null;

  return (
    <Card className="mb-5 p-4 hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-0 border-none bg-transparent cursor-pointer"
      >
        <span className="text-sm font-semibold text-slate-900">
          Deine Angaben ({Object.keys(variables).length})
        </span>
        <div className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors">
          <span className="text-xs">{isExpanded ? 'Einklappen' : 'Ausklappen'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          {Object.entries(variables).map(([key, value]) => (
            <span
              key={key}
              className="bg-indigo-50 px-3 py-1.5 rounded-full text-xs text-slate-700 border border-indigo-100"
            >
              <strong className="text-indigo-700">{getVariableDisplayName(key)}:</strong> {value}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};

/**
 * Delete Confirmation Dialog
 */
const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, isDeleting }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[1000]"
        />
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 max-w-[400px] w-[90%] z-[1001] shadow-2xl"
        >
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Briefing löschen?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Diese Aktion kann nicht rückgängig gemacht werden. Dein Briefing und alle Notizen werden dauerhaft gelöscht.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isDeleting}
                fullWidth
              >
                Abbrechen
              </Button>
              <Button
                variant="danger"
                onClick={onConfirm}
                disabled={isDeleting}
                icon={isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                fullWidth
              >
                {isDeleting ? 'Löschen...' : 'Löschen'}
              </Button>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const BriefingWorkbook = ({
  briefing: initialBriefing,
  onBack,
  onDelete,
}) => {
  const { config } = usePartner();
  const isMobile = useMobile();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [loading, setLoading] = useState(!initialBriefing?.sections);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [isVariablesExpanded, setIsVariablesExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showPresentationDialog, setShowPresentationDialog] = useState(false);
  const [isGeneratingPresentation, setIsGeneratingPresentation] = useState(false);

  // Scroll-based header minimization
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(false);
  const scrollContainerRef = useRef(null);

  const IconComponent = getIcon(briefing?.template_icon) || FileText;

  // Track scroll position to minimize header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsHeaderMinimized(scrollTop > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch full briefing with sections if needed
  useEffect(() => {
    const fetchBriefing = async () => {
      if (briefing?.sections) {
        const expanded = {};
        briefing.sections.forEach((s) => {
          expanded[s.id] = true;
        });
        setExpandedSections(expanded);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await wordpressAPI.request(`/smartbriefing/briefings/${briefing.id}`, {
          method: 'GET',
        });

        if (response.success && response.data?.briefing) {
          setBriefing(response.data.briefing);
          const expanded = {};
          response.data.briefing.sections?.forEach((s) => {
            expanded[s.id] = true;
          });
          setExpandedSections(expanded);
        } else {
          throw new Error('Fehler beim Laden des Briefings');
        }
      } catch (err) {
        console.error('[SmartBriefing] Error fetching briefing:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (briefing?.id) {
      fetchBriefing();
    }
  }, [briefing?.id]);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleUpdateItem = useCallback(async (sectionId, itemId, data) => {
    const response = await wordpressAPI.request(
      `/smartbriefing/sections/${sectionId}/items/${itemId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error('Fehler beim Speichern');
    }

    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? response.data.section : s
      ),
    }));
  }, []);

  const handleGenerateMore = useCallback(async (sectionId) => {
    const response = await wordpressAPI.request(
      `/smartbriefing/sections/${sectionId}/generate-more`,
      {
        method: 'POST',
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Fehler beim Generieren');
    }

    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? response.data.section : s
      ),
    }));

    return response.data.new_items_count;
  }, []);

  // Handler for asking AI about an item
  const handleAskItem = useCallback(async (sectionId, itemId, params) => {
    const response = await wordpressAPI.askBriefingItem(sectionId, itemId, params);

    // Update the section with the new item data (includes new explanation)
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;

        // Parse ai_content if it's a string (it's stored as JSON string)
        let content;
        try {
          content = typeof s.ai_content === 'string'
            ? JSON.parse(s.ai_content)
            : s.ai_content;
        } catch {
          console.error('[SmartBriefing] Failed to parse ai_content');
          return s;
        }

        if (!content?.items) return s;

        // Update the specific item in the section
        const updatedItems = content.items.map((item) =>
          item.id === itemId ? response.item : item
        );

        return {
          ...s,
          ai_content: JSON.stringify({ ...content, items: updatedItems }),
        };
      }),
    }));

    return response;
  }, []);

  // Handler for deleting an AI explanation from an item
  const handleDeleteExplanation = useCallback(async (sectionId, itemId, explanationId) => {
    await wordpressAPI.deleteBriefingItemExplanation(sectionId, itemId, explanationId);

    // Update state to remove the explanation
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;

        // Parse ai_content if it's a string (it's stored as JSON string)
        let content;
        try {
          content = typeof s.ai_content === 'string'
            ? JSON.parse(s.ai_content)
            : s.ai_content;
        } catch {
          console.error('[SmartBriefing] Failed to parse ai_content');
          return s;
        }

        if (!content?.items) return s;

        const updatedItems = content.items.map((item) => {
          if (item.id !== itemId) return item;

          return {
            ...item,
            ai_explanations: (item.ai_explanations || []).filter(
              (exp) => exp.id !== explanationId
            ),
          };
        });

        return {
          ...s,
          ai_content: JSON.stringify({ ...content, items: updatedItems }),
        };
      }),
    }));
  }, []);

  // Handler for adding AI explanation as a new item in the section
  const handleAddAsItem = useCallback(async (sectionId, answer, sourceLabel) => {
    // Create a summary label from the answer (first 50 chars)
    const newLabel = `Vertiefung: ${sourceLabel}`;
    const newContent = answer.length > 200 ? answer.substring(0, 200) + '...' : answer;

    // Find the section and create updated content
    const section = briefing?.sections?.find(s => s.id === sectionId);
    if (!section) return;

    let content;
    try {
      content = typeof section.ai_content === 'string'
        ? JSON.parse(section.ai_content)
        : section.ai_content;
    } catch {
      console.error('[SmartBriefing] Failed to parse ai_content');
      return;
    }

    if (!content?.items) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: newLabel,
      content: newContent,
      user_note: `Vollständige KI-Antwort:\n\n${answer}`,
      deleted: false,
      ai_explanations: [],
    };

    const updatedContent = { ...content, items: [...content.items, newItem] };
    const updatedContentJson = JSON.stringify(updatedContent);

    // Update local state immediately for responsiveness
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ai_content: updatedContentJson } : s
      ),
    }));

    // Persist to backend
    try {
      await wordpressAPI.request(`/smartbriefing/sections/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ai_content: updatedContentJson }),
      });
    } catch (err) {
      console.error('[SmartBriefing] Failed to save new item:', err);
      // Revert on error
      setBriefing((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ai_content: section.ai_content } : s
        ),
      }));
    }
  }, [briefing?.sections]);

  // Handler for adding a single action point from AI explanation
  // actionPoint is now an object: { label: string, content: string }
  const handleAddActionPoint = useCallback(async (sectionId, actionPoint, sourceLabel) => {
    // Use the parsed label and content from actionPoint object
    const newLabel = actionPoint.label || 'Neuer Punkt';
    const newContent = actionPoint.content || actionPoint.label || '';

    // Find the section and create updated content
    const section = briefing?.sections?.find(s => s.id === sectionId);
    if (!section) return;

    let content;
    try {
      content = typeof section.ai_content === 'string'
        ? JSON.parse(section.ai_content)
        : section.ai_content;
    } catch {
      console.error('[SmartBriefing] Failed to parse ai_content');
      return;
    }

    if (!content?.items) return;

    const newItem = {
      id: crypto.randomUUID(),
      label: newLabel,
      content: newContent,
      user_note: '',
      deleted: false,
      ai_explanations: [],
    };

    const updatedContent = { ...content, items: [...content.items, newItem] };
    const updatedContentJson = JSON.stringify(updatedContent);

    // Update local state immediately for responsiveness
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ai_content: updatedContentJson } : s
      ),
    }));

    // Persist to backend
    try {
      await wordpressAPI.request(`/smartbriefing/sections/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ai_content: updatedContentJson }),
      });
    } catch (err) {
      console.error('[SmartBriefing] Failed to save new item:', err);
      // Revert on error
      setBriefing((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ai_content: section.ai_content } : s
        ),
      }));
    }
  }, [briefing?.sections]);

  const handleDownloadPdf = useCallback(async () => {
    if (isDownloadingPdf || !briefing?.id) return;

    setIsDownloadingPdf(true);
    try {
      const response = await wordpressAPI.request(
        `/smartbriefing/briefings/${briefing.id}/pdf`,
        { method: 'GET' }
      );

      if (!response.success || !response.data?.pdf_base64) {
        throw new Error(response.message || 'PDF-Export fehlgeschlagen');
      }

      const byteCharacters = atob(response.data.pdf_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename || 'Smart-Briefing.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SmartBriefing] PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [briefing?.id, isDownloadingPdf]);

  // Handle presentation generation
  const handleGeneratePresentation = useCallback(async (data) => {
    if (isGeneratingPresentation) return;

    setIsGeneratingPresentation(true);
    try {
      await generatePresentationFromBriefing(data);
      setShowPresentationDialog(false);
    } catch (err) {
      console.error('[SmartBriefing] Presentation generation error:', err);
      // TODO: Show error toast
    } finally {
      setIsGeneratingPresentation(false);
    }
  }, [isGeneratingPresentation]);

  const handleDelete = async () => {
    if (!onDelete || !briefing?.id) return;
    setIsDeleting(true);
    try {
      await onDelete(briefing);
    } catch (err) {
      console.error('Failed to delete briefing:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!briefing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Full width sticky, instant switch between minimized/expanded (no animation) */}
      <div
        className={`sticky top-0 z-40 ${
          isHeaderMinimized
            ? isMobile ? 'py-2' : 'py-2.5'
            : isMobile ? 'py-5' : 'py-6'
        }`}
        style={{ background: 'var(--header-gradient, linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%))' }}
      >
        <div className={`max-w-[1400px] mx-auto ${isMobile ? 'px-4' : 'px-8'}`}>
          {/* Back Button - Hidden when minimized */}
          {onBack && !isHeaderMinimized && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-white/15 border-none rounded-xl px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 hover:shadow-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Icon - Large when expanded, small when minimized */}
            {!isMobile && (
              <div
                className={`rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ${
                  isHeaderMinimized ? 'w-10 h-10' : 'w-[90px] h-[90px]'
                }`}
              >
                <IconComponent
                  size={isHeaderMinimized ? 20 : 40}
                  className="text-white"
                />
              </div>
            )}

            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              {/* Tags - Hidden when minimized */}
              {!isHeaderMinimized && (
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/20 text-white">
                    Smart Briefing
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-indigo-700">
                    {briefing.template_title}
                  </span>
                </div>
              )}

              {/* Title - Smaller when minimized */}
              <h1 className={`font-bold text-white m-0 truncate ${
                isHeaderMinimized
                  ? 'text-base md:text-lg'
                  : isMobile ? 'text-xl mb-2' : 'text-2xl mb-2'
              }`}>
                {briefing.title || 'Briefing'}
              </h1>

              {/* Date - Hidden when minimized */}
              {!isHeaderMinimized && (
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                    <Calendar size={14} />
                    {formatDateTime(briefing.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:gap-2.5 flex-shrink-0">
              {/* Back button (icon only) when minimized */}
              {onBack && isHeaderMinimized && (
                <HeaderActionButton
                  onClick={onBack}
                  icon={ArrowLeft}
                  title="Zurück zur Übersicht"
                />
              )}
              <HeaderActionButton
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                loading={isDownloadingPdf}
                icon={Download}
                title="Als PDF herunterladen"
              />
              <HeaderActionButton
                onClick={() => setShowPresentationDialog(true)}
                icon={Presentation}
                title="Präsentation erstellen"
              />
              {onDelete && (
                <HeaderActionButton
                  onClick={() => setShowDeleteConfirm(true)}
                  icon={Trash2}
                  danger
                  title="Briefing löschen"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-[900px] mx-auto ${isMobile ? 'p-4' : 'px-8 py-6'}`}>
        {/* Collapsible Variables display */}
        <VariablesPanel
          variables={briefing.variables}
          isExpanded={isVariablesExpanded}
          onToggle={() => setIsVariablesExpanded(!isVariablesExpanded)}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={40} className="text-indigo-600 animate-spin" />
            <p className="mt-4 text-slate-600 font-medium">Briefing wird geladen...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 m-0">{error}</p>
          </div>
        )}

        {/* Sections */}
        {!loading && !error && briefing.sections && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900 m-0">
                Briefing-Inhalte
              </h2>
              <span className="text-[13px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {briefing.sections.length} Abschnitte
              </span>
            </div>

            {briefing.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onUpdateItem={handleUpdateItem}
                onGenerateMore={handleGenerateMore}
                onAskItem={handleAskItem}
                onDeleteExplanation={handleDeleteExplanation}
                onAddAsItem={handleAddAsItem}
                onAddActionPoint={handleAddActionPoint}
                isExpanded={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        )}

        {/* Fallback: Show markdown if no sections */}
        {!loading && !error && (!briefing.sections || briefing.sections.length === 0) && briefing.content_markdown && (
          <Card className="p-6">
            <MarkdownContent content={briefing.content_markdown} />
          </Card>
        )}

        {/* Info box */}
        <div className="mt-6 px-5 py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="flex items-start gap-3">
            <Lightbulb size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="m-0 mb-1 text-slate-900 text-sm font-semibold">
                Tipp: Personalisiere dein Briefing
              </h4>
              <p className="m-0 text-slate-600 text-[13px] leading-relaxed">
                Klicke auf das Stift-Icon bei jedem Punkt, um deine eigenen Notizen hinzuzufügen.
                Nicht relevante Punkte kannst du mit dem Papierkorb-Icon ausblenden.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Presentation Export Dialog */}
      <PresentationExportDialog
        isOpen={showPresentationDialog}
        onClose={() => setShowPresentationDialog(false)}
        briefing={briefing}
        onGenerate={handleGeneratePresentation}
        isGenerating={isGeneratingPresentation}
      />
    </div>
  );
};

export default BriefingWorkbook;
