import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../../assets/brand/Logo';
import {
  History as HistoryIcon,
  Download,
  Menu,
  X,
  Smartphone,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Mail,
  Phone,
} from 'lucide-react';
import { ThemeMode } from '../../utils/types';
import { UserProfile } from '../../hooks/useAuth';

interface HeaderProps {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  activeView: 'home' | 'history';
  setActiveView: (view: 'home' | 'history') => void;
  onGetStartedClick?: () => void;
  onOpenInstallApp?: () => void;
  activeDownloadsCount: number;
  user?: UserProfile | null;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenInstallApp,
  activeDownloadsCount,
  user,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
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

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Top Gradient Blur Backdrop */}
      <div className="gradient-blur" />

      {/* Floating Red Noir Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 pt-5 px-4">
        <nav className="max-w-5xl mx-auto flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 shadow-2xl">
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
          <div className="hidden md:flex items-center gap-6 font-inter">
            <button
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'home'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('media-vault')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Formats
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'history'
                  ? 'text-[#ef233c] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {/* Right Corner Actions: Active Downloads, Install App, and Sign In / User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Active Downloads Pill */}
            {activeDownloadsCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef233c]/15 text-[#ef233c] border border-[#ef233c]/30 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(239,35,60,0.3)]">
                <Download className="w-3 h-3" />
                <span>{activeDownloadsCount}</span>
              </div>
            )}

            {/* Install App Button */}
            {onOpenInstallApp && (
              <button
                onClick={onOpenInstallApp}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-[#ef233c]/40 text-xs font-bold transition-all shadow-sm cursor-pointer font-manrope group"
                title="Install App on Mac, Windows, iPhone, Android"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#ef233c] group-hover:scale-110 transition-transform" />
                <span>App</span>
              </button>
            )}

            {/* User Profile or Sign In Button */}
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-gradient-to-r from-zinc-900 to-black border border-[#ef233c]/40 hover:border-[#ef233c] text-white transition-all shadow-lg cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ef233c] to-[#d90429] text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                    {getUserInitials(user.name)}
                  </div>
                  <span className="text-xs font-bold max-w-[100px] truncate hidden sm:inline font-manrope">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${profileDropdownOpen ? 'rotate-180 text-[#ef233c]' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-zinc-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-white font-inter animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="pb-3 border-b border-white/10">
                      <div className="font-bold text-sm font-manrope truncate text-white">{user.name}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail className="w-3 h-3 text-[#ef233c]" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef233c]/15 text-[#ef233c] text-[10px] font-bold font-mono">
                        <Shield className="w-3 h-3" />
                        <span>@{user.username}</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setActiveView('history');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <HistoryIcon className="w-3.5 h-3.5 text-[#ef233c]" />
                        <span>My Download History</span>
                      </button>

                      {onLogout && (
                        <button
                          onClick={() => {
                            onLogout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-xs font-bold font-manrope shadow-md shadow-[#ef233c]/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
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
            className="md:hidden mt-3 max-w-md mx-auto bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 space-y-3 shadow-2xl animate-fade-up text-white"
          >
            {user ? (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm font-manrope">{user.name}</div>
                  <div className="text-xs text-zinc-400 truncate">{user.email}</div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth('signin');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white font-bold text-xs uppercase tracking-wider font-manrope shadow-md"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            )}

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
              onClick={() => scrollToSection('media-vault')}
              className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Formats
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
                Install App
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
};
