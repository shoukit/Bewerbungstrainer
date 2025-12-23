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
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

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
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Top row: Icon + Title + Delete */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}30)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: '22px', height: '22px', color: primaryAccent }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '4px',
                lineHeight: '1.3',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {briefing.title || 'Briefing'}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {formatDateTime(briefing.created_at)}
              </div>
            </div>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Löschen"
            >
              {isDeleting ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          </div>

          {/* Bottom row: Template badge + Arrow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <span style={{
              backgroundColor: `${primaryAccent}15`,
              color: primaryAccent,
              padding: '4px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 500,
              maxWidth: '70%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {briefing.template_title}
            </span>
            <ChevronRight size={22} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${primaryAccent}15, ${primaryAccent}30)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon style={{ width: '24px', height: '24px', color: primaryAccent }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {briefing.title || 'Briefing'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              <span style={{
                backgroundColor: `${primaryAccent}15`,
                color: primaryAccent,
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 500,
              }}>
                {briefing.template_title}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDateTime(briefing.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Löschen"
            >
              {isDeleting ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
            <ChevronRight size={20} style={{ color: '#94a3b8' }} />
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
