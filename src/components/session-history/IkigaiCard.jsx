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
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

/**
 * Dimension icons and colors
 */
const DIMENSION_CONFIG = {
  love: { icon: Heart, color: '#E11D48', label: 'Liebe' },
  talent: { icon: Star, color: '#F59E0B', label: 'Talent' },
  need: { icon: Globe, color: '#10B981', label: 'Welt' },
  market: { icon: Coins, color: '#6366F1', label: 'Markt' },
};

/**
 * Mini dimension pills showing tag count
 */
const DimensionPills = ({ dimensions }) => {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
        const tags = dimensions?.[key] || [];
        const hasData = tags.length > 0;
        const Icon = config.icon;

        return (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: hasData ? `${config.color}15` : '#f1f5f9',
              color: hasData ? config.color : '#94a3b8',
              border: hasData ? `1px solid ${config.color}30` : '1px solid #e2e8f0',
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
                background: isComplete
                  ? 'linear-gradient(135deg, #E11D48, #F59E0B, #10B981, #6366F1)'
                  : 'linear-gradient(135deg, #6366F115, #6366F130)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Compass style={{ width: '22px', height: '22px', color: isComplete ? 'white' : '#6366F1' }} />
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
                {title}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {formatDateTime(ikigai.created_at)}
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

          {/* Bottom row: Dimension pills + Arrow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <DimensionPills dimensions={dimensions} />
            <ChevronRight size={22} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
              background: isComplete
                ? 'linear-gradient(135deg, #E11D48, #F59E0B, #10B981, #6366F1)'
                : 'linear-gradient(135deg, #6366F115, #6366F130)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass style={{ width: '24px', height: '24px', color: isComplete ? 'white' : '#6366F1' }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {title}
              </h3>
              {isComplete && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                  }}
                >
                  Abgeschlossen
                </span>
              )}
              {!isComplete && filledDimensions > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#f59e0b20',
                    color: '#f59e0b',
                  }}
                >
                  {filledDimensions}/4 Dimensionen
                </span>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              {/* Dimension pills */}
              <DimensionPills dimensions={dimensions} />
              {/* Date */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDateTime(ikigai.created_at)}
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
        title="Ikigai-Analyse löschen"
        description="Möchtest du diese Ikigai-Analyse wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default IkigaiCard;
