import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  detail?: string;
  count?: number;
  confirmLabel?: string;
  isDangerous?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Penghapusan',
  message,
  detail,
  count = 1,
  confirmLabel,
  isDangerous = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-rose-700 font-medium">
                {count > 1 ? `${count} item akan dihapus sekaligus` : 'Tindakan ini tidak dapat dibatalkan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3 text-xs text-slate-600">
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {message}
          </p>

          {detail && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-700 text-xs break-all">
              {detail}
            </div>
          )}

          <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Perhatian: Data yang sudah dihapus akan hilang dari sistem penyimpanan dan tidak dapat dipulihkan kembali.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {confirmLabel || (count > 1 ? `Hapus ${count} Data Terpilih` : 'Ya, Hapus Sekarang')}
          </button>
        </div>

      </div>
    </div>
  );
};
