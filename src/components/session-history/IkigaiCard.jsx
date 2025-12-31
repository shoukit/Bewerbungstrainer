/**
 * IkigaiCard - Card component for Ikigai Career Pathfinder entries
 *
 * Displays an ikigai analysis with dimension tags, status, and date.
 * Supports both mobile and desktop layouts.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Loader2, Trash2, Compass, Heart, Star, Globe, Coins } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { formatDateTime } from '@/utils/formatting';
import ConfirmDeleteDialog from '@/components/ui/composite/ConfirmDeleteDialog';
import { IKIGAI_COLORS, COLORS } from '@/config/colors';

/**
 * Dimension icons and colors
 * Uses centralized IKIGAI_COLORS from colors.js
 */
const DIMENSION_CONFIG = {
  love: { icon: Heart, color: IKIGAI_COLORS.love.color, label: 'Liebe' },
  talent: { icon: Star, color: IKIGAI_COLORS.talent.color, label: 'Talent' },
  need: { icon: Globe, color: IKIGAI_COLORS.need.color, label: 'Welt' },
  market: { icon: Coins, color: IKIGAI_COLORS.market.color, label: 'Markt' },
};

/**
 * Mini dimension pills showing tag count
 */
const DimensionPills = ({ dimensions }) => {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
        const tags = dimensions?.[key] || [];
        const hasData = tags.length > 0;
        const Icon = config.icon;

        return (
          <div
            key={key}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: hasData ? `${config.color}15` : COLORS.slate[100],
              color: hasData ? config.color : COLORS.slate[400],
              border: hasData ? `1px solid ${config.color}30` : `1px solid ${COLORS.slate[200]}`,
            }}
          >
            <Icon size={12} />
            <span>{tags.length}</span>
          </div>
        );
      })}
    </div>
  );
};

const IkigaiCard = ({
  ikigai,
  onDelete,
  onNavigate,
  headerGradient,
  headerText,
  primaryAccent,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = useMobile(900);

  // Get dimensions data
  const dimensions = {
    love: ikigai.love_tags || [],
    talent: ikigai.talent_tags || [],
    need: ikigai.need_tags || [],
    market: ikigai.market_tags || [],
  };

  // Calculate completion
  const filledDimensions = Object.values(dimensions).filter(d => d.length > 0).length;
  const isComplete = ikigai.status === 'completed';

  // Get title from paths or summary
  const title = ikigai.paths?.[0]?.role_title
    || (isComplete ? 'Ikigai-Analyse abgeschlossen' : 'Ikigai-Analyse')
    || 'Ikigai-Analyse';

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(ikigai.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting ikigai:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mobile-optimized card layout
  if (isMobile) {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div
          onClick={onNavigate}
          className="bg-white rounded-2xl p-4 cursor-pointer border border-slate-200 shadow-sm"
        >
          {/* Top row: Icon + Title + Delete */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isComplete
                  ? `linear-gradient(135deg, ${IKIGAI_COLORS.love.color}, ${IKIGAI_COLORS.talent.color}, ${IKIGAI_COLORS.need.color}, ${IKIGAI_COLORS.market.color})`
                  : `linear-gradient(135deg, ${COLORS.indigo[500]}15, ${COLORS.indigo[500]}30)`,
              }}
            >
              <Compass className={`w-[22px] h-[22px] ${isComplete ? 'text-white' : 'text-indigo-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1 leading-[1.3] line-clamp-2">
                {title}
              </h3>
              <div className="text-[13px] text-slate-500">
                {formatDateTime(ikigai.created_at)}
              </div>
            </div>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-2 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center shrink-0 hover:text-slate-600"
              title="Löschen"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>

          {/* Bottom row: Dimension pills + Arrow */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <DimensionPills dimensions={dimensions} />
            <ChevronRight size={22} className="text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Ikigai-Analyse löschen"
          description="Möchtest du diese Ikigai-Analyse wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          isDeleting={isDeleting}
        />
      </motion.div>
    );
  }

  // Desktop layout
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        onClick={onNavigate}
        className="bg-white rounded-2xl p-5 cursor-pointer border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isComplete
                ? `linear-gradient(135deg, ${IKIGAI_COLORS.love.color}, ${IKIGAI_COLORS.talent.color}, ${IKIGAI_COLORS.need.color}, ${IKIGAI_COLORS.market.color})`
                : `linear-gradient(135deg, ${COLORS.indigo[500]}15, ${COLORS.indigo[500]}30)`,
            }}
          >
            <Compass className={`w-6 h-6 ${isComplete ? 'text-white' : 'text-indigo-500'}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-semibold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">
                {title}
              </h3>
              {isComplete && (
                <span className="px-2 py-0.5 rounded-[10px] text-[11px] font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white">
                  Abgeschlossen
                </span>
              )}
              {!isComplete && filledDimensions > 0 && (
                <span className="px-2 py-0.5 rounded-[10px] text-[11px] font-semibold bg-amber-500/10 text-amber-500">
                  {filledDimensions}/4 Dimensionen
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap text-[13px] text-slate-500">
              {/* Dimension pills */}
              <DimensionPills dimensions={dimensions} />
              {/* Date */}
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDateTime(ikigai.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-2 rounded-lg border-none bg-transparent text-slate-400 cursor-pointer flex items-center justify-center hover:text-red-500 transition-colors"
              title="Löschen"
            >
              {isDeleting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
            <ChevronRight size={20} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Ikigai-Analyse löschen"
        description="Möchtest du diese Ikigai-Analyse wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default IkigaiCard;
