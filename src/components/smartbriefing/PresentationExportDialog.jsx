/**
 * PresentationExportDialog - Dialog for exporting briefing to PowerPoint
 *
 * Allows users to:
 * - Define the presentation goal/audience
 * - Select which items to include
 * - Generate a KI-transformed presentation
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
  FileDown,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';

/**
 * Parse ai_content which can be a JSON string or already parsed array
 */
const parseAiContent = (aiContent) => {
  if (!aiContent) return [];
  if (Array.isArray(aiContent)) return aiContent;
  try {
    const parsed = JSON.parse(aiContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Section with collapsible items
 */
const SectionSelector = ({
  section,
  selectedItems,
  onToggleItem,
  onToggleSection,
  isExpanded,
  onExpandToggle
}) => {
  const items = parseAiContent(section.ai_content).filter(item => !item.deleted);
  const selectedCount = items.filter(item => selectedItems.has(item.id)).length;
  const allSelected = selectedCount === items.length && items.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < items.length;

  if (items.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      {/* Section Header */}
      <button
        type="button"
        onClick={onExpandToggle}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {/* Section checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSection(section.id, items, !allSelected);
            }}
            className="p-0 border-none bg-transparent cursor-pointer text-primary"
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
              ({selectedCount}/{items.length} ausgewählt)
            </span>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {/* Items */}
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
                const hasNote = item.user_note && item.user_note.trim().length > 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
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
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      )}
                      {hasNote && (
                        <p className="text-xs text-amber-600 mt-1 italic line-clamp-1">
                          "{item.user_note}"
                        </p>
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
 * Main Dialog Component
 */
const PresentationExportDialog = ({
  isOpen,
  onClose,
  briefing,
  onGenerate,
  isGenerating = false,
}) => {
  const [presentationGoal, setPresentationGoal] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});

  // Initialize: select all non-deleted items by default
  useEffect(() => {
    if (isOpen && briefing?.sections) {
      const allItemIds = new Set();
      const expanded = {};

      briefing.sections.forEach((section) => {
        expanded[section.id] = true;
        const items = parseAiContent(section.ai_content);
        items.forEach((item) => {
          if (!item.deleted) {
            allItemIds.add(item.id);
          }
        });
      });

      setSelectedItems(allItemIds);
      setExpandedSections(expanded);
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
          if (item.user_note && item.user_note.trim()) {
            withNotes++;
          }
        }
      });
    });

    return {
      total,
      selected: selectedItems.size,
      withNotes,
    };
  }, [briefing, selectedItems]);

  // Toggle single item
  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Toggle all items in a section
  const handleToggleSection = (sectionId, items, selectAll) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      items.forEach((item) => {
        if (selectAll) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      });
      return next;
    });
  };

  // Toggle section expansion
  const handleExpandToggle = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Select all / none
  const handleSelectAll = () => {
    const allItemIds = new Set();
    briefing?.sections?.forEach((section) => {
      const items = parseAiContent(section.ai_content);
      items.forEach((item) => {
        if (!item.deleted) {
          allItemIds.add(item.id);
        }
      });
    });
    setSelectedItems(allItemIds);
  };

  const handleSelectNone = () => {
    setSelectedItems(new Set());
  };

  // Handle generate
  const handleGenerate = () => {
    if (!presentationGoal.trim() || selectedItems.size === 0) return;

    // Collect selected items with their section context
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

    onGenerate({
      goal: presentationGoal.trim(),
      briefingTitle: briefing?.title,
      sections: selectedData,
    });
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
                  Präsentation erstellen
                </h2>
                <p className="text-sm text-slate-500">
                  KI transformiert dein Briefing in eine Story
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Goal Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ziel der Präsentation *
              </label>
              <textarea
                value={presentationGoal}
                onChange={(e) => setPresentationGoal(e.target.value)}
                placeholder="z.B. Pitch vor der Geschäftsführung, Team-Meeting zur Strategievorstellung, Kundenpräsentation..."
                rows={2}
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 text-sm resize-none outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Je genauer du das Ziel beschreibst, desto besser wird die Präsentation strukturiert.
              </p>
            </div>

            {/* Selection Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Welche Punkte einbeziehen?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isGenerating}
                    className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                  >
                    Alle
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleSelectNone}
                    disabled={isGenerating}
                    className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                  >
                    Keine
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
                <span>{stats.selected} von {stats.total} ausgewählt</span>
                {stats.withNotes > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <MessageSquare size={14} />
                    {stats.withNotes} mit Notizen
                  </span>
                )}
              </div>

              {/* Sections */}
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
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !presentationGoal.trim() || selectedItems.size === 0}
              size="lg"
              fullWidth
              icon={isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            >
              {isGenerating ? 'Präsentation wird erstellt...' : 'Präsentation generieren'}
            </Button>

            {selectedItems.size === 0 && (
              <p className="text-xs text-red-500 text-center mt-2">
                Wähle mindestens einen Punkt aus
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PresentationExportDialog;
