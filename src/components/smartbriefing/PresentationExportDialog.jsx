/**
 * PresentationExportDialog - Two-step dialog for PowerPoint export
 *
 * Step 1: Select items + enter goal
 * Step 2: Review/modify AI-proposed slide structure
 * Step 3: Generate final presentation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Presentation,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  Trash2,
  Plus,
  FileText,
  Clock,
  Users,
  Calendar,
  Quote,
  Columns,
  ListChecks,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui';

// Slide type icons and labels
const SLIDE_TYPE_CONFIG = {
  title: { icon: LayoutTemplate, label: 'Titel', color: 'text-purple-600' },
  agenda: { icon: Clock, label: 'Agenda', color: 'text-blue-600' },
  content: { icon: FileText, label: 'Inhalt', color: 'text-slate-600' },
  team: { icon: Users, label: 'Team', color: 'text-violet-600' },
  timeline: { icon: Calendar, label: 'Timeline', color: 'text-emerald-600' },
  quote: { icon: Quote, label: 'Zitat', color: 'text-amber-600' },
  two_columns: { icon: Columns, label: '2 Spalten', color: 'text-cyan-600' },
  summary: { icon: ListChecks, label: 'Fazit', color: 'text-rose-600' },
};

/**
 * Parse ai_content which can be various formats
 */
const parseAiContent = (aiContent) => {
  if (!aiContent) return [];
  if (Array.isArray(aiContent)) return aiContent;
  if (typeof aiContent === 'object' && Array.isArray(aiContent.items)) {
    return aiContent.items;
  }
  if (typeof aiContent === 'string') {
    try {
      const parsed = JSON.parse(aiContent);
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Section selector component (Step 1)
 */
const SectionSelector = ({
  section,
  selectedItems,
  onToggleItem,
  onToggleSection,
  isExpanded,
  onExpandToggle,
  disabled,
}) => {
  const items = parseAiContent(section.ai_content).filter(item => !item.deleted);
  const selectedCount = items.filter(item => selectedItems.has(item.id)).length;
  const allSelected = selectedCount === items.length && items.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < items.length;

  if (items.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <button
        type="button"
        onClick={onExpandToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSection(section.id, items, !allSelected);
            }}
            disabled={disabled}
            className="p-0 border-none bg-transparent cursor-pointer text-primary disabled:cursor-not-allowed"
          >
            {allSelected ? (
              <CheckSquare size={20} />
            ) : someSelected ? (
              <div className="relative">
                <Square size={20} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-primary rounded-sm" />
                </div>
              </div>
            ) : (
              <Square size={20} className="text-slate-400" />
            )}
          </button>
          <div>
            <span className="font-medium text-slate-900">{section.section_title}</span>
            <span className="ml-2 text-sm text-slate-500">
              ({selectedCount}/{items.length})
            </span>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-white">
              {items.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const hasNote = item.user_note?.trim().length > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    disabled={disabled}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors disabled:opacity-50 ${
                      isSelected
                        ? 'bg-primary/5 border border-primary/20'
                        : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Square size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                        {hasNote && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                            <MessageSquare size={10} />
                            Notiz
                          </span>
                        )}
                      </div>
                      {item.content && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.content}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Slide structure editor (Step 2)
 */
const SlideStructureEditor = ({ structure, onChange, disabled }) => {
  const handleRemoveSlide = (index) => {
    const newSlides = structure.slides.filter((_, i) => i !== index);
    onChange({ ...structure, slides: newSlides });
  };

  const handleMoveSlide = (index, direction) => {
    const newSlides = [...structure.slides];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    onChange({ ...structure, slides: newSlides });
  };

  const handleAddSlide = () => {
    const newSlide = {
      type: 'content',
      title: 'Neue Slide',
      description: 'Inhalt wird generiert',
    };
    onChange({ ...structure, slides: [...structure.slides, newSlide] });
  };

  const handleUpdateSlide = (index, updates) => {
    const newSlides = [...structure.slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onChange({ ...structure, slides: newSlides });
  };

  return (
    <div className="space-y-3">
      {structure.slides.map((slide, index) => {
        const typeConfig = SLIDE_TYPE_CONFIG[slide.type] || SLIDE_TYPE_CONFIG.content;
        const Icon = typeConfig.icon;

        return (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl group"
          >
            {/* Drag handle (visual only for now) */}
            <div className="text-slate-300 cursor-grab">
              <GripVertical size={18} />
            </div>

            {/* Slide number */}
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
              {index + 1}
            </div>

            {/* Type icon */}
            <div className={`${typeConfig.color}`}>
              <Icon size={18} />
            </div>

            {/* Slide info - editable title */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleUpdateSlide(index, { title: e.target.value })}
                disabled={disabled}
                className="w-full font-medium text-slate-900 text-sm bg-transparent border-none outline-none focus:bg-slate-50 focus:px-2 rounded disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 truncate">{slide.description || typeConfig.label}</p>
            </div>

            {/* Type badge */}
            <span className={`text-xs px-2 py-1 rounded-full bg-slate-100 ${typeConfig.color}`}>
              {typeConfig.label}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleMoveSlide(index, -1)}
                disabled={disabled || index === 0}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                title="Nach oben"
              >
                <ChevronUp size={16} className="text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveSlide(index, 1)}
                disabled={disabled || index === structure.slides.length - 1}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                title="Nach unten"
              >
                <ChevronDown size={16} className="text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSlide(index)}
                disabled={disabled || structure.slides.length <= 2}
                className="p-1 hover:bg-red-50 rounded disabled:opacity-30"
                title="Entfernen"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add slide button */}
      <button
        type="button"
        onClick={handleAddSlide}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        <Plus size={18} />
        <span className="text-sm font-medium">Slide hinzufügen</span>
      </button>
    </div>
  );
};

/**
 * Main Dialog Component
 */
const PresentationExportDialog = ({
  isOpen,
  onClose,
  briefing,
  onGenerateStructure,
  onGeneratePresentation,
  isLoading = false,
  loadingStep = null, // 'structure' | 'presentation'
}) => {
  // Step: 'select' (1) or 'structure' (2)
  const [step, setStep] = useState('select');
  const [presentationGoal, setPresentationGoal] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});
  const [proposedStructure, setProposedStructure] = useState(null);

  // Reset on open
  useEffect(() => {
    if (isOpen && briefing?.sections) {
      const allItemIds = new Set();
      const expanded = {};

      briefing.sections.forEach((section) => {
        expanded[section.id] = true;
        const items = parseAiContent(section.ai_content);
        items.forEach((item) => {
          if (!item.deleted) allItemIds.add(item.id);
        });
      });

      setSelectedItems(allItemIds);
      setExpandedSections(expanded);
      setStep('select');
      setProposedStructure(null);
      setPresentationGoal('');
    }
  }, [isOpen, briefing]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!briefing?.sections) return { total: 0, selected: 0, withNotes: 0 };

    let total = 0;
    let withNotes = 0;

    briefing.sections.forEach((section) => {
      const items = parseAiContent(section.ai_content);
      items.forEach((item) => {
        if (!item.deleted) {
          total++;
          if (item.user_note?.trim()) withNotes++;
        }
      });
    });

    return { total, selected: selectedItems.size, withNotes };
  }, [briefing, selectedItems]);

  // Item selection handlers
  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleToggleSection = (sectionId, items, selectAll) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        if (selectAll) next.add(item.id);
        else next.delete(item.id);
      });
      return next;
    });
  };

  const handleExpandToggle = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleSelectAll = () => {
    const allItemIds = new Set();
    briefing?.sections?.forEach((section) => {
      const items = parseAiContent(section.ai_content);
      items.forEach((item) => {
        if (!item.deleted) allItemIds.add(item.id);
      });
    });
    setSelectedItems(allItemIds);
  };

  const handleSelectNone = () => setSelectedItems(new Set());

  // Collect selected data
  const collectSelectedData = () => {
    const selectedData = [];
    briefing?.sections?.forEach((section) => {
      const items = parseAiContent(section.ai_content);
      const sectionItems = items.filter(item => !item.deleted && selectedItems.has(item.id));

      if (sectionItems.length > 0) {
        selectedData.push({
          sectionTitle: section.section_title,
          items: sectionItems.map(item => ({
            label: item.label,
            content: item.content,
            userNote: item.user_note || null,
          })),
        });
      }
    });
    return selectedData;
  };

  // Step 1 → Step 2: Generate structure
  const handleNextStep = async () => {
    if (!presentationGoal.trim() || selectedItems.size === 0) return;

    const data = {
      goal: presentationGoal.trim(),
      briefingTitle: briefing?.title,
      sections: collectSelectedData(),
    };

    const structure = await onGenerateStructure(data);
    if (structure) {
      setProposedStructure(structure);
      setStep('structure');
    }
  };

  // Step 2 → Generate final presentation
  const handleGeneratePresentation = () => {
    if (!proposedStructure) return;

    const data = {
      goal: presentationGoal.trim(),
      briefingTitle: briefing?.title,
      sections: collectSelectedData(),
    };

    onGeneratePresentation(data, proposedStructure);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Presentation size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {step === 'select' ? 'Präsentation erstellen' : 'Struktur prüfen'}
                </h2>
                <p className="text-sm text-slate-500">
                  {step === 'select'
                    ? 'Schritt 1: Ziel & Inhalte wählen'
                    : 'Schritt 2: Slide-Struktur anpassen'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {step === 'select' ? (
              <>
                {/* Goal Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ziel der Präsentation *
                  </label>
                  <textarea
                    value={presentationGoal}
                    onChange={(e) => setPresentationGoal(e.target.value)}
                    placeholder="z.B. Kickoff-Meeting für Projekt X, Pitch vor der Geschäftsführung, Kundenpräsentation..."
                    rows={2}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-400 disabled:bg-slate-50"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Die KI erkennt den Dokumenttyp und schlägt passende Slides vor (Team, Timeline, etc.)
                  </p>
                </div>

                {/* Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Welche Punkte einbeziehen?
                    </label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSelectAll} disabled={isLoading} className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50">Alle</button>
                      <span className="text-slate-300">|</span>
                      <button type="button" onClick={handleSelectNone} disabled={isLoading} className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50">Keine</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                    <span>{stats.selected} von {stats.total} ausgewählt</span>
                    {stats.withNotes > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <MessageSquare size={14} />
                        {stats.withNotes} mit Notizen
                      </span>
                    )}
                  </div>

                  <div className="space-y-0">
                    {briefing?.sections?.map((section) => (
                      <SectionSelector
                        key={section.id}
                        section={section}
                        selectedItems={selectedItems}
                        onToggleItem={handleToggleItem}
                        onToggleSection={handleToggleSection}
                        isExpanded={expandedSections[section.id]}
                        onExpandToggle={() => handleExpandToggle(section.id)}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Structure Editor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">
                        Vorgeschlagene Struktur
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reihenfolge ändern, Slides entfernen oder hinzufügen
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {proposedStructure?.slides?.length || 0} Slides
                    </span>
                  </div>

                  {proposedStructure && (
                    <SlideStructureEditor
                      structure={proposedStructure}
                      onChange={setProposedStructure}
                      disabled={isLoading}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50">
            {step === 'select' ? (
              <>
                <Button
                  onClick={handleNextStep}
                  disabled={isLoading || !presentationGoal.trim() || selectedItems.size === 0}
                  size="lg"
                  fullWidth
                  icon={isLoading && loadingStep === 'structure' ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                >
                  {isLoading && loadingStep === 'structure' ? 'Struktur wird erstellt...' : 'Weiter zur Struktur'}
                </Button>
                {selectedItems.size === 0 && (
                  <p className="text-xs text-red-500 text-center mt-2">Wähle mindestens einen Punkt aus</p>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('select')}
                  disabled={isLoading}
                  variant="secondary"
                  icon={<ArrowLeft size={18} />}
                >
                  Zurück
                </Button>
                <Button
                  onClick={handleGeneratePresentation}
                  disabled={isLoading || !proposedStructure?.slides?.length}
                  size="lg"
                  className="flex-1"
                  icon={isLoading && loadingStep === 'presentation' ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                >
                  {isLoading && loadingStep === 'presentation' ? 'Präsentation wird erstellt...' : 'Präsentation generieren'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PresentationExportDialog;
