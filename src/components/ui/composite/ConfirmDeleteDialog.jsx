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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="min-w-[100px] h-10 px-5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm font-medium transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="min-w-[100px] h-10 px-5 py-2 rounded-lg border-none bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
