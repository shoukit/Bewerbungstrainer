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
  Trash2,
  ChevronRight,
  Calendar,
  FolderOpen,
  Plus,
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
 * Briefing Card Component
 */
const BriefingCard = ({ briefing, onOpen, onDelete, primaryAccent, isDeleting }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const IconComponent = ICON_MAP[briefing.template_icon] || FileText;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete(briefing.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      onClick={() => onOpen(briefing)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        border: `2px solid ${isHovered ? primaryAccent : '#e2e8f0'}`,
        boxShadow: isHovered
          ? `0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px ${primaryAccent}20`
          : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {/* Header with icon and actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={22} style={{ color: primaryAccent }} />
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: showDeleteConfirm ? '#fef2f2' : (isHovered ? '#f1f5f9' : 'transparent'),
            color: showDeleteConfirm ? '#ef4444' : '#94a3b8',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: isHovered || showDeleteConfirm ? 1 : 0,
          }}
        >
          {isDeleting ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#0f172a',
          margin: '0 0 4px 0',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {briefing.title || 'Unbenanntes Briefing'}
      </h3>

      {/* Template name */}
      <p
        style={{
          fontSize: '13px',
          color: '#64748b',
          margin: '0 0 12px 0',
        }}
      >
        {briefing.template_title}
      </p>

      {/* Footer with date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px' }}>
          <Calendar size={14} />
          {formatDate(briefing.created_at)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: primaryAccent,
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Offnen
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#dc2626',
            fontWeight: 500,
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Nochmal klicken zum Loschen
        </div>
      )}

      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

/**
 * BriefingList Component
 *
 * Displays all saved briefings for the current user
 */
const BriefingList = ({
  onOpenBriefing,
  onCreateNew,
  isAuthenticated,
}) => {
  const { config } = usePartner();
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Get primary accent color from partner config
  const primaryAccent = config?.buttonGradientStart || '#3A7FA7';

  // Fetch briefings on mount
  useEffect(() => {
    const fetchBriefings = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await wordpressAPI.request('/smartbriefing/briefings', {
          method: 'GET',
        });

        if (response.success && response.data?.briefings) {
          // Filter only completed briefings
          const completedBriefings = response.data.briefings.filter(b => b.status === 'completed');
          setBriefings(completedBriefings);
        } else {
          throw new Error('Unerwartete API-Antwort');
        }
      } catch (err) {
        console.error('[SmartBriefing] Error fetching briefings:', err);
        setError(err.message || 'Fehler beim Laden der Briefings');
      } finally {
        setLoading(false);
      }
    };

    fetchBriefings();
  }, [isAuthenticated]);

  // Handle briefing deletion
  const handleDelete = async (briefingId) => {
    try {
      setDeletingId(briefingId);

      const response = await wordpressAPI.request(`/smartbriefing/briefings/${briefingId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        setBriefings((prev) => prev.filter((b) => b.id !== briefingId));
      } else {
        throw new Error('Fehler beim Loschen');
      }
    } catch (err) {
      console.error('[SmartBriefing] Error deleting briefing:', err);
      setError(err.message || 'Fehler beim Loschen des Briefings');
    } finally {
      setDeletingId(null);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: '24px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <FolderOpen size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <h2 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '18px' }}>
            Anmeldung erforderlich
          </h2>
          <p style={{ color: '#94a3b8', margin: '0 0 24px 0', fontSize: '14px' }}>
            Melde dich an, um deine gespeicherten Briefings zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 4px 0',
            }}
          >
            Meine Briefings
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {briefings.length} gespeicherte Briefings
          </p>
        </div>
        <button
          onClick={onCreateNew}
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
          }}
        >
          <Plus size={18} />
          Neues Briefing
        </button>
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
            Briefings werden geladen...
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

      {/* Briefings Grid */}
      {!loading && !error && (
        <>
          {briefings.length === 0 ? (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <FolderOpen size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <h2 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '18px' }}>
                Noch keine Briefings
              </h2>
              <p style={{ color: '#94a3b8', margin: '0 0 24px 0', fontSize: '14px' }}>
                Erstelle dein erstes Briefing, um loszulegen.
              </p>
              <button
                onClick={onCreateNew}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${primaryAccent}, ${primaryAccent}dd)`,
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 4px 14px ${primaryAccent}40`,
                }}
              >
                <Plus size={18} />
                Briefing erstellen
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {briefings.map((briefing) => (
                <BriefingCard
                  key={briefing.id}
                  briefing={briefing}
                  onOpen={onOpenBriefing}
                  onDelete={handleDelete}
                  primaryAccent={primaryAccent}
                  isDeleting={deletingId === briefing.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BriefingList;
