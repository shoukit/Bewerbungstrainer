/**
 * ConfirmDeleteDialog - Styled confirmation dialog for delete actions
 *
 * Extracted from SessionHistory.jsx for reuse across the app.
 */

import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/base/dialog';
import { usePartner } from '@/context/PartnerContext';
import { DEFAULT_BRANDING } from '@/config/partners';

const ConfirmDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Löschen bestätigen',
  description = 'Diese Aktion kann nicht rückgängig gemacht werden.',
  isDeleting = false,
  confirmLabel = 'Löschen',
  cancelLabel = 'Abbrechen',
}) => {
  const { branding } = usePartner();
  const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: '400px' }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter style={{ marginTop: '16px' }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              minWidth: '100px',
              height: '40px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: `2px solid ${primaryAccent}`,
              backgroundColor: 'white',
              color: primaryAccent,
              fontSize: '14px',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              minWidth: '100px',
              height: '40px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                {confirmLabel}...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
