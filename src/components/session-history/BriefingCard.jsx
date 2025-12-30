/**
 * BriefingCard - Card component for Smart Briefings
 *
 * Displays a briefing with icon, title, date, and template info.
 * Supports both mobile and desktop layouts.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useMobile } from '@/hooks/useMobile';
import { formatDateTime } from '@/utils/formatting';
import { getBriefingIcon } from '@/utils/iconMaps';
import ConfirmDeleteDialog from '@/components/ui/composite/ConfirmDeleteDialog';

const BriefingCard = ({
  briefing,
  onClick,
  onDelete,
  headerGradient,
  headerText,
  primaryAccent,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Use 900px breakpoint for better tablet support (consistent with SessionCard)
  const isMobile = useMobile(900);

  const Icon = getBriefingIcon(briefing.template_icon);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(briefing.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting briefing:', err);
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
          onClick={onClick}
          className="bg-white rounded-2xl p-4 cursor-pointer border border-slate-200 shadow-sm"
        >
          {/* Top row: Icon + Title + Delete */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-[22px] h-[22px] text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-slate-900 mb-1 leading-[1.3] line-clamp-2">
                {briefing.title || 'Briefing'}
              </h3>
              <div className="text-[13px] text-slate-500">
                {formatDateTime(briefing.created_at)}
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

          {/* Bottom row: Template badge + Arrow */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-[10px] text-xs font-medium max-w-[70%] overflow-hidden text-ellipsis whitespace-nowrap">
              {briefing.template_title}
            </span>
            <ChevronRight size={22} className="text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Briefing löschen"
          description="Möchtest du dieses Briefing wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
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
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {briefing.title || 'Briefing'}
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-[13px] text-slate-500">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-[10px] text-xs font-medium">
                {briefing.template_title}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDateTime(briefing.created_at)}
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
        title="Briefing löschen"
        description="Möchtest du dieses Briefing wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default BriefingCard;
