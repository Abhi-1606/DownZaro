import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../../assets/brand/Logo';
import { History as HistoryIcon, Download, Menu, X, Smartphone } from 'lucide-react';
import { ThemeMode } from '../../utils/types';

interface HeaderProps {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  activeView: 'home' | 'history';
  setActiveView: (view: 'home' | 'history') => void;
  onGetStartedClick?: () => void;
  onOpenInstallApp?: () => void;
  activeDownloadsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenInstallApp,
  activeDownloadsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveView('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      {/* Top Gradient Blur Backdrop */}
      <div className="gradient-blur" />

      {/* Floating Red Noir Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 pt-5 px-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 shadow-2xl">
          {/* Left: Logo */}
          <div
            className="cursor-pointer flex items-center"
            onClick={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveView('home')}
            aria-label="DownZaro Home"
          >
            <Logo size={28} showWordmark={true} />
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-7 font-inter">
            <button
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-sm font-medium transition-colors ${
                activeView === 'home'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeView === 'history'
                  ? 'text-[#ef233c] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {/* Right Corner Actions: Active Download Pill & Install App Button */}
          <div className="flex items-center gap-3">
            {/* Active Downloads Pill */}
            {activeDownloadsCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef233c]/15 text-[#ef233c] border border-[#ef233c]/30 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(239,35,60,0.3)]">
                <Download className="w-3 h-3" />
                <span>{activeDownloadsCount} active</span>
              </div>
            )}

            {/* Corner Install App Button */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#ef233c]/40 text-xs font-bold transition-all shadow-sm cursor-pointer font-manrope group"
                title="Install App on Mac, Windows, iPhone, Android"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#ef233c] group-hover:scale-110 transition-transform" />
                <span>Install App</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden mt-3 max-w-md mx-auto bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-2xl animate-fade-up"
          >
            <button
              onClick={() => {
                setActiveView('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold rounded-lg text-white hover:bg-white/5 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => {
                setActiveView('history');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-[#ef233c] bg-[#ef233c]/10 cursor-pointer"
            >
              <HistoryIcon className="w-4 h-4" />
              Download History
            </button>
            {onOpenInstallApp && (
              <button
                onClick={() => {
                  onOpenInstallApp();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#ef233c] to-red-700 shadow-md cursor-pointer font-manrope"
              >
                <Smartphone className="w-4 h-4" />
                Install App (Mac, iPhone, Windows, Android)
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
};
