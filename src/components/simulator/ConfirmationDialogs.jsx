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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-[420px] w-[90%] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <Check size={24} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 m-0">
            Training beenden?
          </h3>
        </div>
        {answeredCount > 0 ? (
          <>
            <p className="text-sm text-slate-600 leading-relaxed mb-2">
              Du hast <strong>{labels.answeredCount(answeredCount, totalCount)}</strong> beantwortet.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Möchtest du das Training jetzt mit den bisherigen Antworten abschließen oder weitere {labels.questionsLabel} beantworten?
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Du hast noch keine {labels.questionsLabel} beantwortet. Möchtest du das Training wirklich beenden?
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Weiter trainieren
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl border-none bg-green-500 text-white text-sm font-semibold cursor-pointer shadow-md shadow-green-500/30 hover:bg-green-600 transition-colors"
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-[420px] w-[90%] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 m-0">
            Training abbrechen?
          </h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          <strong>Achtung:</strong> Wenn du das Training abbrichst, werden alle deine bisherigen Antworten
          {answeredCount > 0 ? ` (${answeredCount} ${labels.questionsLabel})` : ''} <strong>nicht gespeichert</strong> und gehen verloren.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl border-none bg-red-500 text-white text-sm font-semibold cursor-pointer shadow-md shadow-red-500/30 hover:bg-red-600 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default { CompleteConfirmDialog, CancelConfirmDialog };
