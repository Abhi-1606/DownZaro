import React from 'react';
import { X, Shield, FileText, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'dmca' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-2xl bg-zinc-950/95 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {type === 'terms' && (
          <div className="space-y-4 text-xs text-zinc-400 leading-relaxed font-inter">
            <div className="flex items-center gap-2.5 text-lg font-bold text-white mb-4 font-manrope">
              <FileText className="w-5 h-5 text-[#ef233c]" />
              Terms of Use
            </div>
            <p>
              DownZaro is provided for personal, non-commercial use to assist users in saving content they have legitimate rights or authorization to access and download.
            </p>
            <h4 className="font-bold text-white text-sm font-manrope">1. User Responsibility</h4>
            <p>
              You agree to only download media that you own or for which you have explicit permission from the rights holder. DownZaro does not host or store copyrighted material on its servers.
            </p>
            <h4 className="font-bold text-white text-sm font-manrope">2. Technical Restrictions</h4>
            <p>
              DownZaro strictly prohibits and does not facilitate circumvention of Digital Rights Management (DRM) or technical protection measures.
            </p>
          </div>
        )}

        {type === 'privacy' && (
          <div className="space-y-4 text-xs text-zinc-400 leading-relaxed font-inter">
            <div className="flex items-center gap-2.5 text-lg font-bold text-white mb-4 font-manrope">
              <Shield className="w-5 h-5 text-emerald-400" />
              Privacy Policy
            </div>
            <p>
              DownZaro is built with privacy by design. We do not track users, sell personal information, or retain persistent records of media requests.
            </p>
            <h4 className="font-bold text-white text-sm font-manrope">1. Temporary Processing</h4>
            <p>
              All downloaded files and stream conversions are isolated in temporary storage and automatically deleted within 30 minutes.
            </p>
            <h4 className="font-bold text-white text-sm font-manrope">2. Client Storage</h4>
            <p>
              Download history is stored purely in your local browser storage (`localStorage`) and is never uploaded to remote servers.
            </p>
          </div>
        )}

        {type === 'dmca' && (
          <div className="space-y-4 text-xs text-zinc-400 leading-relaxed font-inter">
            <div className="flex items-center gap-2.5 text-lg font-bold text-white mb-4 font-manrope">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Content & Copyright Policy (DMCA)
            </div>
            <p>
              DownZaro respects intellectual property rights. If you believe your copyrighted work is being accessed inappropriately, please contact us.
            </p>
            <p>
              Contact Email:{' '}
              <a href="mailto:copyright@downzaro.local" className="font-bold text-[#ef233c] underline">
                copyright@downzaro.local
              </a>
            </p>
            <p className="text-[11px] text-zinc-500">
              * Note: This application acts as a client-side proxy utility and does not store or host media files.
            </p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#ef233c] hover:bg-red-700 transition-all cursor-pointer font-manrope shadow-[0_0_20px_rgba(239,35,60,0.4)]"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

