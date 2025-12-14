import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import wordpressAPI from '../../services/wordpress-api';
import {
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
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
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
 * Category configuration
 */
const CATEGORIES = {
  CAREER: { label: 'Karriere', color: '#3b82f6' },
  SALES: { label: 'Vertrieb', color: '#22c55e' },
  LEADERSHIP: { label: 'Fuhrung', color: '#a855f7' },
  COMMUNICATION: { label: 'Kommunikation', color: '#f59e0b' },
};

/**
 * Template Card Component
 */
const TemplateCard = ({ template, onSelect, primaryAccent }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = ICON_MAP[template.icon] || FileText;
  const category = CATEGORIES[template.category] || CATEGORIES.CAREER;
  const variableCount = template.variables_schema?.length || 0;

  return (
    <div
      onClick={() => onSelect(template)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: `2px solid ${isHovered ? primaryAccent : '#e2e8f0'}`,
        boxShadow: isHovered
          ? `0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px ${primaryAccent}20`
          : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with icon and category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={28} style={{ color: primaryAccent }} />
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: `${category.color}15`,
            color: category.color,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {category.label}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 8px 0',
          lineHeight: 1.3,
        }}
      >
        {template.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          margin: '0 0 16px 0',
          lineHeight: 1.5,
          minHeight: '42px',
        }}
      >
        {template.description}
      </p>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {variableCount} Eingabefeld{variableCount !== 1 ? 'er' : ''}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: primaryAccent,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Briefing erstellen
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

/**
 * SmartBriefingDashboard Component
 *
 * Displays available briefing templates for selection
 */
const SmartBriefingDashboard = ({
  onSelectTemplate,
  isAuthenticated,
  requireAuth,
  setPendingAction,
}) => {
  const { config } = usePartner();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Get primary accent color from partner config
  const primaryAccent = config?.buttonGradientStart || '#3A7FA7';

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await wordpressAPI.request('/smartbriefing/templates', {
          method: 'GET',
        });

        if (response.success && response.data?.templates) {
          setTemplates(response.data.templates);
        } else {
          throw new Error('Unerwartete API-Antwort');
        }
      } catch (err) {
        console.error('[SmartBriefing] Error fetching templates:', err);
        setError(err.message || 'Fehler beim Laden der Templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    // For now, allow non-authenticated users to view templates
    // Auth check happens when trying to generate
    onSelectTemplate(template);
  };

  // Filter templates by category
  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  // Get unique categories from templates
  const availableCategories = [...new Set(templates.map(t => t.category))];

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={24} style={{ color: 'white' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}
            >
              Smart Briefing
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              Dein KI-gestützter Vorbereitungs-Assistent
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {availableCategories.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: selectedCategory === null ? primaryAccent : '#f1f5f9',
                color: selectedCategory === null ? 'white' : '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Alle
            </button>
            {availableCategories.map(cat => {
              const category = CATEGORIES[cat] || { label: cat, color: '#64748b' };
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: selectedCategory === cat ? category.color : '#f1f5f9',
                    color: selectedCategory === cat ? 'white' : '#64748b',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

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
            Templates werden geladen...
          </p>
          <style>
            {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
          </style>
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
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#dc2626', fontSize: '16px' }}>
              Fehler beim Laden
            </h3>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <>
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
              }}
            >
              <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h3 style={{ color: '#64748b', margin: '0 0 8px 0' }}>
                Keine Templates gefunden
              </h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                {selectedCategory
                  ? 'In dieser Kategorie sind keine Templates verfügbar.'
                  : 'Es wurden noch keine Briefing-Templates erstellt.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  primaryAccent={primaryAccent}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div
        style={{
          marginTop: '48px',
          padding: '20px 24px',
          backgroundColor: `${primaryAccent}08`,
          borderRadius: '12px',
          border: `1px solid ${primaryAccent}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Lightbulb size={20} style={{ color: primaryAccent, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '14px', fontWeight: 600 }}>
              So funktioniert Smart Briefing
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>
              Wahle ein Template aus, gib deine spezifischen Informationen ein (z.B. Unternehmen, Position),
              und erhalte ein massgeschneidertes Briefing mit Insider-Wissen, Fachbegriffen und cleveren Ruckfragen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartBriefingDashboard;
