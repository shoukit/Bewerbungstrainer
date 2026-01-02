/**
 * BriefingList Component
 *
 * Displays all saved briefings for the current user.
 * Migrated to Tailwind CSS for consistent styling.
 */

import React, { useState, useEffect } from 'react';
import { usePartner } from '../../context/PartnerContext';
import wordpressAPI from '../../services/wordpress-api';
import { Button, Card } from '@/components/ui';
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
const BriefingCard = ({ briefing, onOpen, onDelete, isDeleting }) => {
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
    <Card
      onClick={() => onOpen(briefing)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
      className={`p-5 cursor-pointer transition-all duration-300 relative ${
        isHovered
          ? 'border-primary shadow-lg -translate-y-0.5'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header with icon and actions */}
      <div className="flex justify-between items-start mb-3">
        <div className="w-11 h-11 rounded-[10px] bg-primary/10 flex items-center justify-center">
          <IconComponent size={22} className="text-primary" />
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`p-2 rounded-lg border-none cursor-pointer transition-all ${
            showDeleteConfirm
              ? 'bg-red-50 text-red-500'
              : isHovered
              ? 'bg-slate-100 text-slate-400'
              : 'bg-transparent text-slate-400'
          } ${isHovered || showDeleteConfirm ? 'opacity-100' : 'opacity-0'} ${
            isDeleting ? 'cursor-not-allowed' : ''
          }`}
        >
          {isDeleting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
        </button>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 mb-1 leading-tight truncate">
        {briefing.title || 'Unbenanntes Briefing'}
      </h3>

      {/* Template name */}
      <p className="text-[13px] text-slate-500 mb-3">
        {briefing.template_title}
      </p>

      {/* Footer with date */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Calendar size={14} />
          {formatDate(briefing.created_at)}
        </div>
        <div className="flex items-center gap-1 text-primary text-[13px] font-medium">
          Öffnen
          <ChevronRight size={16} />
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          className="absolute top-2 right-2 bg-red-50 border border-red-200 rounded-lg py-2 px-3 text-xs text-red-600 font-medium z-10"
          onClick={(e) => e.stopPropagation()}
        >
          Nochmal klicken zum Löschen
        </div>
      )}
    </Card>
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
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
        throw new Error('Fehler beim Löschen');
      }
    } catch (err) {
      console.error('[SmartBriefing] Error deleting briefing:', err);
      setError(err.message || 'Fehler beim Löschen des Briefings');
    } finally {
      setDeletingId(null);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <Card className="py-12 px-6 text-center">
          <FolderOpen size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg text-slate-500 mb-2">
            Anmeldung erforderlich
          </h2>
          <p className="text-sm text-slate-400">
            Melde dich an, um deine gespeicherten Briefings zu sehen.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Meine Briefings
          </h1>
          <p className="text-sm text-slate-500">
            {briefings.length} gespeicherte Briefings
          </p>
        </div>
        <Button onClick={onCreateNew} icon={<Plus size={18} />}>
          Neues Briefing
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="mt-4 text-slate-500">
            Briefings werden geladen...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
          <div>
            <h3 className="text-base text-red-600 font-medium mb-1">
              Fehler beim Laden
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Briefings Grid */}
      {!loading && !error && (
        <>
          {briefings.length === 0 ? (
            <Card className="py-12 px-6 text-center">
              <FolderOpen size={48} className="text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg text-slate-500 mb-2">
                Noch keine Briefings
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Erstelle dein erstes Briefing, um loszulegen.
              </p>
              <Button onClick={onCreateNew} icon={<Plus size={18} />}>
                Briefing erstellen
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {briefings.map((briefing) => (
                <BriefingCard
                  key={briefing.id}
                  briefing={briefing}
                  onOpen={onOpenBriefing}
                  onDelete={handleDelete}
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
