import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

/**
 * Complete Session Confirmation Dialog
 * Shows when user clicks "Training beenden"
 */
export const CompleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalCount,
  labels
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Check size={24} color="#22c55e" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Training beenden?
          </h3>
        </div>
        {answeredCount > 0 ? (
          <>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>
              Du hast <strong>{labels.answeredCount(answeredCount, totalCount)}</strong> beantwortet.
            </p>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Möchtest du das Training jetzt mit den bisherigen Antworten abschließen oder weitere {labels.questionsLabel} beantworten?
            </p>
          </>
        ) : (
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            Du hast noch keine {labels.questionsLabel} beantwortet. Möchtest du das Training wirklich beenden?
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Weiter trainieren
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#22c55e',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            }}
          >
            Training beenden
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Cancel Session Confirmation Dialog
 * Shows when user clicks "Abbrechen" - warns that data will be lost
 */
export const CancelConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  labels
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Training abbrechen?
          </h3>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
          <strong>Achtung:</strong> Wenn du das Training abbrichst, werden alle deine bisherigen Antworten
          {answeredCount > 0 ? ` (${answeredCount} ${labels.questionsLabel})` : ''} <strong>nicht gespeichert</strong> und gehen verloren.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Zurück
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#ef4444',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default { CompleteConfirmDialog, CancelConfirmDialog };
