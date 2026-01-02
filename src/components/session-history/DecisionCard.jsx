/**
 * DecisionCard - Card component for Decision Board entries
 *
 * Displays a decision with topic, pro/contra count, date, and score bar.
 * Supports both mobile and desktop layouts.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Loader2, Trash2, Scale, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { formatDateTime } from '@/utils/formatting';
import ConfirmDeleteDialog from '@/components/ui/composite/ConfirmDeleteDialog';
import { COLORS } from '@/config/colors';

/**
 * Mini Score Bar for cards
 */
const MiniScoreBar = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;

  return (
    <div className="h-1.5 rounded-[3px] overflow-hidden flex bg-slate-100 w-full max-w-[120px]">
      <div
        className="bg-gradient-to-r from-green-500 to-green-600 h-full"
        style={{ width: `${proPercentage}%` }}
      />
      <div
        className="bg-gradient-to-r from-red-500 to-red-600 h-full"
        style={{ width: `${100 - proPercentage}%` }}
      />
    </div>
  );
};

const DecisionCard = ({
  decision,
  onClick,
  onDelete,
  headerGradient,
  headerText,
  primaryAccent,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = useMobile(900);

  // Calculate scores
  const proScore = (decision.pros || []).reduce((acc, item) => acc + (item.text?.trim() ? (item.weight || 5) : 0), 0);
  const contraScore = (decision.cons || []).reduce((acc, item) => acc + (item.text?.trim() ? (item.weight || 5) : 0), 0);
  const proCount = (decision.pros || []).filter(p => p.text?.trim()).length;
  const contraCount = (decision.cons || []).filter(c => c.text?.trim()).length;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(decision.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting decision:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine recommendation color based on analysis
  const getRecommendationColor = () => {
    if (!decision.analysis?.recommendation) return COLORS.slate[500];
    const rec = decision.analysis.recommendation.toLowerCase();
    if (rec.includes('dafür') || rec.includes('empfehl') || rec.includes('ja')) return COLORS.green[600];
    if (rec.includes('dagegen') || rec.includes('nein') || rec.includes('abraten')) return COLORS.red[600];
    return COLORS.amber[500];
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
          onClick={onClick}
          className="bg-white rounded-2xl p-4 cursor-pointer border border-slate-200 shadow-sm"
        >
          {/* Top row: Icon + Title + Delete */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Scale className="w-[22px] h-[22px] text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1 leading-[1.3] line-clamp-2">
                {decision.topic || 'Entscheidung'}
              </h3>
              <div className="text-[13px] text-slate-500">
                {formatDateTime(decision.created_at)}
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

          {/* Bottom row: Pro/Contra counts + Score bar + Arrow */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-1">
                <ThumbsUp size={14} className="text-green-600" />
                <span className="text-[13px] font-medium text-green-600">{proCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown size={14} className="text-red-600" />
                <span className="text-[13px] font-medium text-red-600">{contraCount}</span>
              </div>
              <MiniScoreBar proScore={proScore} contraScore={contraScore} />
            </div>
            <ChevronRight size={22} className="text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Entscheidung löschen"
          description="Möchtest du diese Entscheidung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
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
        onClick={onClick}
        className="bg-white rounded-2xl p-5 cursor-pointer border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all"
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-purple-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {decision.topic || 'Entscheidung'}
            </h3>
            <div className="flex items-center gap-4 flex-wrap text-[13px] text-slate-500">
              {/* Pro/Contra counts */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ThumbsUp size={14} className="text-green-600" />
                  <span className="font-medium text-green-600">{proCount} Pro</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown size={14} className="text-red-600" />
                  <span className="font-medium text-red-600">{contraCount} Contra</span>
                </div>
              </div>
              {/* Score bar */}
              <MiniScoreBar proScore={proScore} contraScore={contraScore} />
              {/* Date */}
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDateTime(decision.created_at)}
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
        title="Entscheidung löschen"
        description="Möchtest du diese Entscheidung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default DecisionCard;
