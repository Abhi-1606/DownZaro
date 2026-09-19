import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Laptop, Apple, Monitor, CheckCircle, Share2, PlusSquare } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'apple' | 'mac' | 'windows' | 'android'>('auto');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isMac = /Macintosh|Mac OS X/.test(ua) && !isIOS;
    const isAndroid = /Android/.test(ua);
    const isWindows = /Windows/.test(ua);

    if (isIOS) setActiveTab('apple');
    else if (isMac) setActiveTab('mac');
    else if (isAndroid) setActiveTab('android');
    else if (isWindows) setActiveTab('windows');

    // Check if already standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        onInstallSuccess();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-xl bg-zinc-950/95 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ef233c]/15 border border-[#ef233c]/30 text-[#ef233c] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(239,35,60,0.3)]">
            <Download className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-white font-manrope tracking-tight">
            Install <span className="text-[#ef233c]">DownZaro App</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto font-inter">
            Works natively on Mac, iPhone, iPad, Windows, and Android with zero installation store hassle.
          </p>
        </div>

        {/* 1-Click Native Install Banner if Supported */}
        {deferredPrompt && !isInstalled && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#ef233c]/20 to-transparent border border-[#ef233c]/40 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white font-manrope">Fast 1-Click Installation</p>
              <p className="text-[11px] text-zinc-300">Add to your device as a standalone native app</p>
            </div>
            <button
              onClick={handleNativeInstall}
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-[#ef233c] hover:bg-red-700 transition-all font-manrope shadow-[0_0_15px_rgba(239,35,60,0.5)] shrink-0 cursor-pointer"
            >
              Install Now
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">DownZaro is already running as an installed standalone App!</span>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10 mb-6 font-manrope overflow-x-auto">
          <button
            onClick={() => setActiveTab('apple')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'apple' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> iPhone / iPad
          </button>
          <button
            onClick={() => setActiveTab('mac')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'mac' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" /> Mac
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'windows' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Windows
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'android' ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Android
          </button>
        </div>

        {/* Platform Instructions Guide */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-300 space-y-3 font-inter">
          {activeTab === 'apple' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm font-manrope flex items-center gap-2">
                <Apple className="w-4 h-4 text-[#ef233c]" /> Apple iOS (iPhone & iPad Safari)
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-300 leading-relaxed">
                <li>
                  Open <span className="text-white font-semibold">Safari</span> and visit this website.
                </li>
                <li>
                  Tap the <span className="text-white font-semibold inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded"><Share2 className="w-3 h-3" /> Share button</span> at the bottom of your screen.
                </li>
                <li>
                  Scroll down the share sheet and tap <span className="text-[#ef233c] font-semibold inline-flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span>.
                </li>
                <li>Tap <span className="text-white font-semibold">Add</span> in the top right corner. DownZaro will appear on your home screen like a native App!</li>
              </ol>
            </div>
          )}

          {activeTab === 'mac' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm font-manrope flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#ef233c]" /> Apple Mac (macOS)
              </h4>
              <ul className="space-y-2 text-zinc-300 leading-relaxed">
                <li>
                  <strong className="text-white">In Safari (macOS Sonoma+):</strong> Click <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">File ➔ Add to Dock...</span> to install DownZaro into your Applications & Dock.
                </li>
                <li>
                  <strong className="text-white">In Chrome or Edge:</strong> Click the <span className="text-[#ef233c] bg-white/10 px-1.5 py-0.5 rounded">Install DownZaro</span> icon on the right side of the address bar.
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'windows' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm font-manrope flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#ef233c]" /> Windows PC & Surface
              </h4>
              <ul className="space-y-2 text-zinc-300 leading-relaxed">
                <li>
                  <strong className="text-white">In Google Chrome:</strong> Click the <span className="text-[#ef233c] bg-white/10 px-1.5 py-0.5 rounded">Install App</span> icon in the address bar.
                </li>
                <li>
                  <strong className="text-white">In Microsoft Edge:</strong> Click <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">Settings (•••) ➔ Apps ➔ Install DownZaro</span>.
                </li>
                <li>It will run in its own dedicated window and pin to your Start Menu and Taskbar.</li>
              </ul>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm font-manrope flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#ef233c]" /> Android Phones & Tablets
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-300 leading-relaxed">
                <li>Open this page in <span className="text-white font-semibold">Chrome</span> or your mobile browser.</li>
                <li>Tap the browser menu <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">⋮ (three dots)</span> in the top right corner.</li>
                <li>Tap <span className="text-[#ef233c] font-semibold bg-white/10 px-1.5 py-0.5 rounded">Install App</span> or <span className="text-white font-semibold">Add to Home screen</span>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer Done Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-all cursor-pointer font-manrope"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
