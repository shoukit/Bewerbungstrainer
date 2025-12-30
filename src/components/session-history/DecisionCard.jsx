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

/**
 * Mini Score Bar for cards
 */
const MiniScoreBar = ({ proScore, contraScore }) => {
  const total = proScore + contraScore;
  const proPercentage = total > 0 ? Math.round((proScore / total) * 100) : 50;

  return (
    <div style={{
      height: '6px',
      borderRadius: '3px',
      overflow: 'hidden',
      display: 'flex',
      backgroundColor: '#f1f5f9',
      width: '100%',
      maxWidth: '120px',
    }}>
      <div
        style={{
          background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
          width: `${proPercentage}%`,
          height: '100%',
        }}
      />
      <div
        style={{
          background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
          width: `${100 - proPercentage}%`,
          height: '100%',
        }}
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
    if (!decision.analysis?.recommendation) return '#64748b';
    const rec = decision.analysis.recommendation.toLowerCase();
    if (rec.includes('dafür') || rec.includes('empfehl') || rec.includes('ja')) return '#16a34a';
    if (rec.includes('dagegen') || rec.includes('nein') || rec.includes('abraten')) return '#dc2626';
    return '#f59e0b';
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
                background: 'linear-gradient(135deg, #8b5cf615, #8b5cf630)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Scale style={{ width: '22px', height: '22px', color: '#8b5cf6' }} />
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
                {decision.topic || 'Entscheidung'}
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {formatDateTime(decision.created_at)}
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

          {/* Bottom row: Pro/Contra counts + Score bar + Arrow */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ThumbsUp size={14} color="#16a34a" />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#16a34a' }}>{proCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ThumbsDown size={14} color="#dc2626" />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#dc2626' }}>{contraCount}</span>
              </div>
              <MiniScoreBar proScore={proScore} contraScore={contraScore} />
            </div>
            <ChevronRight size={22} style={{ color: '#94a3b8', flexShrink: 0 }} />
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
              background: 'linear-gradient(135deg, #8b5cf615, #8b5cf630)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Scale style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {decision.topic || 'Entscheidung'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: '#64748b',
            }}>
              {/* Pro/Contra counts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ThumbsUp size={14} color="#16a34a" />
                  <span style={{ fontWeight: 500, color: '#16a34a' }}>{proCount} Pro</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ThumbsDown size={14} color="#dc2626" />
                  <span style={{ fontWeight: 500, color: '#dc2626' }}>{contraCount} Contra</span>
                </div>
              </div>
              {/* Score bar */}
              <MiniScoreBar proScore={proScore} contraScore={contraScore} />
              {/* Date */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDateTime(decision.created_at)}
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
        title="Entscheidung löschen"
        description="Möchtest du diese Entscheidung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};

export default DecisionCard;
