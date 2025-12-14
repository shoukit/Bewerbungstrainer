import React, { useState, useEffect, useCallback } from 'react';
import { usePartner } from '../../context/PartnerContext';
import wordpressAPI from '../../services/wordpress-api';
import {
  ArrowLeft,
  FileText,
  Briefcase,
  Banknote,
  Users,
  User,
  MessageCircle,
  Target,
  Award,
  Book,
  ClipboardList,
  Star,
  Lightbulb,
  Shield,
  Compass,
  Rocket,
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
} from 'lucide-react';

/**
 * Icon mapping for template icons
 */
const ICON_MAP = {
  'file-text': FileText,
  'briefcase': Briefcase,
  'banknote': Banknote,
  'users': Users,
  'user': User,
  'message-circle': MessageCircle,
  'target': Target,
  'award': Award,
  'book': Book,
  'clipboard': ClipboardList,
  'star': Star,
  'lightbulb': Lightbulb,
  'shield': Shield,
  'compass': Compass,
  'rocket': Rocket,
};

/**
 * Variable name mapping - technical keys to display names
 */
const VARIABLE_DISPLAY_NAMES = {
  // Common variables
  role_name: 'Position',
  position: 'Position',
  target_company: 'Unternehmen',
  company: 'Unternehmen',
  interview_type: 'Gesprächsart',
  karrierelevel: 'Karrierelevel',
  experience_years: 'Berufserfahrung',
  industry: 'Branche',

  // Salary negotiation
  current_salary: 'Aktuelles Gehalt',
  target_salary: 'Zielgehalt',
  negotiation_context: 'Verhandlungskontext',

  // Customer meeting
  customer_name: 'Kunde',
  meeting_goal: 'Gesprächsziel',
  product_service: 'Produkt/Service',

  // General
  user_name: 'Name',
  skills: 'Fähigkeiten',
  strengths: 'Stärken',
  challenges: 'Herausforderungen',
};

/**
 * Get display name for a variable key
 */
const getVariableDisplayName = (key) => {
  return VARIABLE_DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Render inline markdown (bold, italic, code)
 */
const renderInlineMarkdown = (text, primaryAccent) => {
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
          <strong key={key++} style={{ fontWeight: 600, color: '#0f172a' }}>
            {earliest.match[1]}
          </strong>
        );
        break;
      case 'italic':
        parts.push(
          <em key={key++} style={{ fontStyle: 'italic' }}>
            {earliest.match[1] || earliest.match[2]}
          </em>
        );
        break;
      case 'code':
        parts.push(
          <code
            key={key++}
            style={{
              backgroundColor: '#f1f5f9',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: primaryAccent,
            }}
          >
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
const MarkdownContent = ({ content, primaryAccent }) => {
  if (!content) return null;

  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            style={{
              margin: '8px 0',
              paddingLeft: '20px',
              listStyle: 'none',
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: '6px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#374151',
                  position: 'relative',
                  paddingLeft: '16px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: primaryAccent,
                    fontWeight: 'bold',
                  }}
                >
                  {listType === 'number' ? `${idx + 1}.` : '•'}
                </span>
                {renderInlineMarkdown(item, primaryAccent)}
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

      // Bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        currentList.push(trimmedLine.substring(2));
        return;
      }

      // Numbered list
      const numberMatch = trimmedLine.match(/^(\d+)\.\s/);
      if (numberMatch) {
        if (listType !== 'number') {
          flushList();
          listType = 'number';
        }
        currentList.push(trimmedLine.substring(numberMatch[0].length));
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p
          key={`p-${index}`}
          style={{
            margin: '8px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: '#374151',
          }}
        >
          {renderInlineMarkdown(trimmedLine, primaryAccent)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return <div>{renderMarkdown(content)}</div>;
};

/**
 * Item Card Component - Individual briefing item with note and delete
 */
const ItemCard = ({ item, sectionId, primaryAccent, onUpdateItem }) => {
  const [note, setNote] = useState(item.user_note || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNoteField, setShowNoteField] = useState(!!item.user_note);

  // Track changes
  useEffect(() => {
    setHasChanges(note !== (item.user_note || ''));
  }, [note, item.user_note]);

  // Handle save note
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

  // Handle delete item
  const handleDelete = async () => {
    try {
      await onUpdateItem(sectionId, item.id, { deleted: true });
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Handle restore item
  const handleRestore = async () => {
    try {
      await onUpdateItem(sectionId, item.id, { deleted: false });
    } catch (err) {
      console.error('Error restoring item:', err);
    }
  };

  if (item.deleted) {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: 0.6,
        }}
      >
        <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>
          <s>{item.label}</s> - gelöscht
        </span>
        <button
          onClick={handleRestore}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#e2e8f0',
            color: '#64748b',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={12} />
          Wiederherstellen
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Item Header */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: primaryAccent,
                flexShrink: 0,
              }}
            />
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                margin: 0,
              }}
            >
              {item.label}
            </h4>
          </div>
          {item.content && (
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '0 0 0 14px',
                lineHeight: 1.5,
              }}
            >
              {renderInlineMarkdown(item.content, primaryAccent)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {item.user_note && !showNoteField && (
            <span
              style={{
                fontSize: '11px',
                color: primaryAccent,
                backgroundColor: `${primaryAccent}15`,
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Notiz
            </span>
          )}
          <button
            onClick={() => setShowNoteField(!showNoteField)}
            title="Notiz hinzufügen"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: showNoteField ? `${primaryAccent}15` : 'transparent',
              color: showNoteField ? primaryAccent : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PenLine size={16} />
          </button>
          <button
            onClick={handleDelete}
            title="Löschen"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Note Field (collapsible) */}
      {showNoteField && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fafbfc',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Deine Notiz zu diesem Punkt..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              color: '#374151',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryAccent;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', gap: '8px' }}>
            <button
              onClick={() => {
                setShowNoteField(false);
                setNote(item.user_note || '');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveNote}
              disabled={isSaving || !hasChanges}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: saveSuccess
                  ? '#dcfce7'
                  : hasChanges
                    ? primaryAccent
                    : '#f1f5f9',
                color: saveSuccess
                  ? '#16a34a'
                  : hasChanges
                    ? 'white'
                    : '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: hasChanges && !isSaving ? 'pointer' : 'default',
              }}
            >
              {isSaving ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : saveSuccess ? (
                <Check size={12} />
              ) : (
                <Save size={12} />
              )}
              {saveSuccess ? 'Gespeichert!' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

/**
 * Section Card Component - Handles both item-based and legacy markdown content
 */
const SectionCard = ({ section, primaryAccent, onUpdateItem, onGenerateMore, isExpanded, onToggle }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle generate more click
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
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0f172a',
            margin: 0,
            textAlign: 'left',
          }}
        >
          {section.section_title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'items' && (
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                backgroundColor: '#f1f5f9',
                padding: '4px 8px',
                borderRadius: '12px',
              }}
            >
              {visibleItems.length} Punkte
            </span>
          )}
          {hasNotes && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: primaryAccent,
                backgroundColor: `${primaryAccent}15`,
                padding: '4px 8px',
                borderRadius: '12px',
              }}
            >
              <PenLine size={12} />
              Notizen
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={20} style={{ color: '#94a3b8' }} />
          ) : (
            <ChevronDown size={20} style={{ color: '#94a3b8' }} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '16px 20px' }}>
          {type === 'items' ? (
            <>
              {/* Items list */}
              {visibleItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  primaryAccent={primaryAccent}
                  onUpdateItem={onUpdateItem}
                />
              ))}

              {/* Generate more button */}
              {onGenerateMore && (
                <button
                  onClick={handleGenerateMore}
                  disabled={isGenerating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 16px',
                    marginTop: '12px',
                    marginBottom: '8px',
                    borderRadius: '10px',
                    border: `1px dashed ${primaryAccent}40`,
                    backgroundColor: `${primaryAccent}08`,
                    color: primaryAccent,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isGenerating ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isGenerating) {
                      e.currentTarget.style.backgroundColor = `${primaryAccent}15`;
                      e.currentTarget.style.borderColor = `${primaryAccent}60`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${primaryAccent}08`;
                    e.currentTarget.style.borderColor = `${primaryAccent}40`;
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Generiere 5 weitere Punkte...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      5 weitere Punkte generieren
                    </>
                  )}
                </button>
              )}

              {/* Deleted items (collapsed) */}
              {deletedItems.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={12} />
                    {deletedItems.length} gelöschte {deletedItems.length === 1 ? 'Punkt' : 'Punkte'}
                  </div>
                  {deletedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      primaryAccent={primaryAccent}
                      onUpdateItem={onUpdateItem}
                    />
                  ))}
                </div>
              )}
            </>
          ) : type === 'markdown' ? (
            /* Legacy markdown content */
            <div
              style={{
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Bot size={16} style={{ color: primaryAccent }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  KI-Empfehlung
                </span>
              </div>
              <MarkdownContent content={content} primaryAccent={primaryAccent} />
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Kein Inhalt verfügbar</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * BriefingWorkbook Component
 *
 * Displays a briefing with all sections and editable user notes per item
 */
const BriefingWorkbook = ({
  briefing: initialBriefing,
  onBack,
}) => {
  const { config } = usePartner();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [loading, setLoading] = useState(!initialBriefing?.sections);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Get primary accent color from partner config
  const primaryAccent = config?.buttonGradientStart || '#3A7FA7';
  const IconComponent = ICON_MAP[briefing?.template_icon] || FileText;

  // Fetch full briefing with sections if needed
  useEffect(() => {
    const fetchBriefing = async () => {
      if (briefing?.sections) {
        // Already have sections, expand all by default
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
          // Expand all sections by default
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

  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  // Update item within a section
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

    // Update local state with the updated section
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? response.data.section : s
      ),
    }));
  }, []);

  // Generate more items for a section
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

    // Update local state with the updated section
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? response.data.section : s
      ),
    }));

    return response.data.new_items_count;
  }, []);

  if (!briefing) {
    return null;
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
          border: 'none',
          background: 'none',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={18} />
        Zurück zur Übersicht
      </button>

      {/* Header */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}25)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComponent size={28} style={{ color: primaryAccent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: '0 0 4px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {briefing.title || 'Briefing'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  {briefing.template_title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94a3b8' }}>
                  <Calendar size={12} />
                  {formatDate(briefing.created_at)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Variables display */}
        {briefing.variables && Object.keys(briefing.variables).length > 0 && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {Object.entries(briefing.variables).map(([key, value]) => (
              <span
                key={key}
                style={{
                  backgroundColor: '#f1f5f9',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                <strong style={{ color: '#374151' }}>{getVariableDisplayName(key)}:</strong> {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
          }}
        >
          <Loader2
            size={40}
            style={{
              color: primaryAccent,
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ marginTop: '16px', color: '#64748b' }}>
            Briefing wird geladen...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Sections */}
      {!loading && !error && briefing.sections && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: primaryAccent }} />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Briefing-Inhalte
            </h2>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              ({briefing.sections.length} Abschnitte)
            </span>
          </div>

          {briefing.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              primaryAccent={primaryAccent}
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
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <MarkdownContent content={briefing.content_markdown} primaryAccent={primaryAccent} />
        </div>
      )}

      {/* Info box */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px 20px',
          backgroundColor: `${primaryAccent}08`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Lightbulb size={18} style={{ color: primaryAccent, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
              Tipp: Personalisiere dein Briefing
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
              Klicke auf das Stift-Icon bei jedem Punkt, um deine eigenen Notizen hinzuzufügen.
              Nicht relevante Punkte kannst du mit dem Papierkorb-Icon ausblenden.
            </p>
          </div>
        </div>
      </div>

      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default BriefingWorkbook;
