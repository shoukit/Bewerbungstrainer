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
  Play,
  Sparkles,
  PenLine,
  Bot,
  Trash2,
  ChevronDown,
  ChevronUp,
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
 * Simple Markdown Renderer
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
                  {listType === 'number' ? `${idx + 1}.` : ''}
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
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  const renderInlineMarkdown = (text) => {
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

  return <div>{renderMarkdown(content)}</div>;
};

/**
 * Section Card Component
 */
const SectionCard = ({ section, primaryAccent, onSaveNotes, isExpanded, onToggle }) => {
  const [notes, setNotes] = useState(section.user_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(notes !== (section.user_notes || ''));
  }, [notes, section.user_notes]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveNotes(section.id, notes);
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setNotes('');
  };

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
      {/* Section Header - Always visible */}
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
          {section.user_notes && (
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
        <div style={{ padding: '0' }}>
          {/* AI Content */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Bot size={16} style={{ color: primaryAccent }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                KI-Empfehlung
              </span>
            </div>
            <MarkdownContent content={section.ai_content} primaryAccent={primaryAccent} />
          </div>

          {/* User Notes */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PenLine size={16} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Deine Notizen
                </span>
              </div>
              {notes && (
                <button
                  onClick={handleClear}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} />
                  Leeren
                </button>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notiere hier deine Gedanken, Ideen oder spezifische Antworten..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid #e2e8f0',
                fontSize: '14px',
                color: '#374151',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = primaryAccent;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
              }}
            />

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: '8px',
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
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: hasChanges && !isSaving ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Speichern...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={16} />
                    Gespeichert!
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Speichern
                  </>
                )}
              </button>
            </div>
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
 * BriefingWorkbook Component
 *
 * Displays a briefing with all sections and editable user notes
 */
const BriefingWorkbook = ({
  briefing: initialBriefing,
  onBack,
  onStartSimulation,
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

  // Save section notes
  const handleSaveNotes = useCallback(async (sectionId, notes) => {
    const response = await wordpressAPI.request(`/smartbriefing/sections/${sectionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ user_notes: notes }),
    });

    if (!response.success) {
      throw new Error('Fehler beim Speichern');
    }

    // Update local state
    setBriefing((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, user_notes: notes } : s
      ),
    }));
  }, []);

  // Handle start simulation
  const handleStartSimulation = () => {
    if (onStartSimulation && briefing?.variables) {
      onStartSimulation(briefing.variables);
    }
  };

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
        Zuruck zur Ubersicht
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

          {/* Start Simulation Button */}
          {onStartSimulation && briefing?.variables && (
            <button
              onClick={handleStartSimulation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}dd)`,
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${primaryAccent}40`,
                whiteSpace: 'nowrap',
              }}
            >
              <Play size={18} />
              Training starten
            </button>
          )}
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
                <strong style={{ color: '#374151' }}>{key}:</strong> {value}
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
              onSaveNotes={handleSaveNotes}
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
              Tipp: Nutze die Notiz-Felder
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
              Schreibe zu jedem Abschnitt deine eigenen Gedanken, spezifischen Antworten oder Ideen auf.
              Deine Notizen werden automatisch gespeichert und helfen dir bei der Vorbereitung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefingWorkbook;
