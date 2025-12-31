/**
 * BriefingWorkbook - Interactive briefing display with editable notes
 *
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  RotateCcw,
  Lightbulb,
  FileText,
  Download,
} from 'lucide-react';

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
 * Item Card Component - Individual briefing item with note and delete
 */
const ItemCard = ({ item, sectionId, onUpdateItem }) => {
  const [note, setNote] = useState(item.user_note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNoteField, setShowNoteField] = useState(!!item.user_note);

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
          {item.user_note && !showNoteField && (
            <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Notiz
            </span>
          )}
          <button
            onClick={() => setShowNoteField(!showNoteField)}
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
const SectionCard = ({ section, onUpdateItem, onGenerateMore, isExpanded, onToggle }) => {
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

  const IconComponent = getIcon(briefing?.template_icon) || FileText;

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
      {/* Header - Full width sticky */}
      <div
        className="sticky top-0 z-40 px-4 py-5 md:px-8 md:py-6"
        style={{ background: 'var(--header-gradient, linear-gradient(135deg, #3A7FA7 0%, #4A9BC7 100%))' }}
      >
        <div className="max-w-[1400px] mx-auto">
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 bg-white/15 border-none rounded-xl px-3 py-2 cursor-pointer text-white text-[13px] mb-4 hover:bg-white/25 hover:shadow-lg transition-all"
            >
              <ArrowLeft size={16} />
              Zurück zur Übersicht
            </button>
          )}

          {/* Header Content */}
          <div className="flex items-center gap-6">
            {/* Icon - Hidden on mobile */}
            {!isMobile && (
              <div className="w-[90px] h-[90px] rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <IconComponent size={40} className="text-white" />
              </div>
            )}

            {/* Title & Meta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/20 text-white">
                  Smart Briefing
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-indigo-700">
                  {briefing.template_title}
                </span>
              </div>
              <h1 className={`font-bold text-white m-0 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                {briefing.title || 'Briefing'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-[13px] text-white/80">
                  <Calendar size={14} />
                  {formatDateTime(briefing.created_at)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 flex-shrink-0">
              <HeaderActionButton
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                loading={isDownloadingPdf}
                icon={Download}
                title="Als PDF herunterladen"
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
    </div>
  );
};

export default BriefingWorkbook;
