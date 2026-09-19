import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  toast: {
    visible: boolean;
    message: string;
    action: () => void;
  } | null;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ toast, onDismiss }) => {
  if (!toast || !toast.visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-6 left-6 z-50 animate-fade-up"
    >
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-zinc-900/90 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-xl">
        <span className="text-sm font-medium font-inter">{toast.message}</span>
        <button
          onClick={() => {
            toast.action();
          }}
          className="text-sm font-bold text-[#ef233c] hover:underline flex items-center gap-1.5 cursor-pointer font-manrope"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

