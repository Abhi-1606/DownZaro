import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Fingerprint,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Laptop,
  KeyRound,
  Phone,
} from 'lucide-react';
import { useAuth, getSavedAccounts, removeSavedAccountFromDevice, SavedAccount } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
  auth: ReturnType<typeof useAuth>;
  limitReachedNotice?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  auth,
  limitReachedNotice = false,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'password' | 'passkey'>('password');
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form State
  const [name, setName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Google & Registered Accounts State
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [dbAccounts, setDbAccounts] = useState<SavedAccount[]>([]);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotDiscovered, setForgotDiscovered] = useState<{
    found: boolean;
    name?: string;
    email?: string;
    masked_email?: string;
    phone?: string;
    masked_phone?: string;
    has_email?: boolean;
    has_phone?: boolean;
  } | null>(null);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpCode, setForgotOtpCode] = useState('');
  const [forgotDevOtpCode, setForgotDevOtpCode] = useState<string | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Quick Device Email State
  const [quickDeviceEmail, setQuickDeviceEmail] = useState('');
  const [quickDeviceName, setQuickDeviceName] = useState('');

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Merge local device accounts with registered DB accounts
  const allGoogleAccounts = React.useMemo(() => {
    const map = new Map<string, SavedAccount>();
    // From DB
    dbAccounts.forEach((acc) => {
      if (acc.email) {
        map.set(acc.email.toLowerCase(), {
          email: acc.email,
          name: acc.name || 'User',
          username: acc.username || acc.email.split('@')[0],
          lastUsed: Date.now(),
        });
      }
    });
    // From local saved accounts
    savedAccounts.forEach((acc) => {
      if (acc.email) {
        map.set(acc.email.toLowerCase(), acc);
      }
    });
    return Array.from(map.values());
  }, [dbAccounts, savedAccounts]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSavedAccounts(getSavedAccounts());
      resetMessages();
      setShowGoogleChooser(false);
      setShowDevicePicker(false);
      setShowCustomGoogleInput(false);
      setIsSubmitting(false);
      setForgotOtpSent(false);
      setForgotDevOtpCode(null);
      setForgotDiscovered(null);

      // Load all registered user accounts from backend
      auth.getRegisteredGoogleAccounts().then((accounts: any[]) => {
        if (accounts && Array.isArray(accounts)) {
          setDbAccounts(accounts);
        }
      }).catch(() => {});
    }
  }, [isOpen, initialMode]);

  // Cooldown timer for OTP resends
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!identifier.trim()) {
      setError('Please enter your email, username, or phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.loginWithPassword(identifier.trim(), password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Sign Up Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanName = name.trim();
    const cleanUsername = signupUsername.trim().toLowerCase();
    const cleanEmail = signupEmail.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanUsername) {
      setError('Please choose a username.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, dots, and underscores.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.register({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: signupPassword,
        phone: signupPhone.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Google Sign In & Sign Up Handler
  const handleGoogleSubmit = async (googleEmail: string, googleName?: string) => {
    resetMessages();
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.googleAuth({
        email: cleanEmail,
        name: googleName || cleanEmail.split('@')[0],
        mode: mode === 'signup' ? 'signup' : 'signin',
      });
      setShowGoogleChooser(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Stored / Device Account 1-Click Login
  const handleStoredAccountSelect = async (account: SavedAccount) => {
    resetMessages();
    setIsSubmitting(true);
    try {
      await auth.loginWithDeviceAccount({
        email: account.email,
        name: account.name,
        username: account.username,
      });
      setShowDevicePicker(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate stored account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Quick Device Email Sign In / Sign Up
  const handleQuickDeviceEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!quickDeviceEmail.trim() || !quickDeviceEmail.includes('@')) {
      setError('Please enter a valid email address from your device.');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.loginWithDeviceAccount({
        email: quickDeviceEmail.trim(),
        name: quickDeviceName.trim() || undefined,
      });
      setShowDevicePicker(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Device sign in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    removeSavedAccountFromDevice(email);
    setSavedAccounts(getSavedAccounts());
  };

  // 6. Forgot Password: Lookup Account & Send Reset OTP to Email
  const handleForgotLookupChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email or username.');
      return;
    }
    resetMessages();
    setIsSubmitting(true);
    try {
      const channels = await auth.getOtpChannels(forgotIdentifier.trim());
      setForgotDiscovered(channels);
      const targetEmail = (channels?.email || forgotIdentifier).trim();
      const res = await auth.requestOtp(targetEmail, 'reset', 'email');
      setForgotOtpSent(true);
      setResendCooldown(30);
      if (res.dev_code) {
        setForgotDevOtpCode(res.dev_code);
        setForgotOtpCode(res.dev_code);
      } else {
        setForgotDevOtpCode(null);
      }
      setSuccess(
        res.message ||
          `6-digit reset code sent to ${channels?.masked_email || channels?.email || targetEmail}. Please check your inbox.`
      );
    } catch (err: any) {
      setError(err.message || 'No account found with this identifier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSendOtp = async () => {
    resetMessages();
    const finalDest = (forgotDiscovered?.email || forgotIdentifier).trim();

    setIsSubmitting(true);
    try {
      const res = await auth.requestOtp(finalDest, 'reset', 'email');
      setForgotOtpSent(true);
      setResendCooldown(30);
      if (res.dev_code) {
        setForgotDevOtpCode(res.dev_code);
        setForgotOtpCode(res.dev_code);
      } else {
        setForgotDevOtpCode(null);
      }
      setSuccess(
        res.message ||
          `6-digit reset code sent to ${forgotDiscovered?.masked_email || forgotDiscovered?.email || finalDest}. Please check your inbox.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtpCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    resetMessages();
    const finalDest = (forgotDiscovered?.email || forgotIdentifier).trim();

    setIsSubmitting(true);
    try {
      await auth.resetPassword({
        destination: finalDest,
        code: forgotOtpCode.trim(),
        new_password: forgotNewPassword,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(239,35,60,0.15)] backdrop-blur-2xl overflow-hidden font-inter text-left max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ef233c]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#d90429]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-10 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Limit Reached Callout */}
        {limitReachedNotice && (
          <div className="mb-4 p-3 rounded-2xl bg-[#ef233c]/15 border border-[#ef233c]/40 flex items-start gap-2.5 text-xs text-red-200 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#ef233c] shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-white mb-0.5">3 Free Guest Downloads Used!</strong>
              Sign in or create a free account to unlock unlimited 4K video and lossless audio downloads.
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: GOOGLE CONNECT / ACCOUNT CHOOSER
            ========================================================================= */}
        {showGoogleChooser ? (
          <div className="space-y-4">
            <div className="text-center pt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-zinc-900 shadow-lg shadow-white/10 mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold font-manrope text-white tracking-tight">
                {mode === 'signup' ? 'Sign Up with Google' : 'Sign In with Google'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'signup'
                  ? 'Connect your Gmail account to register instantly on DownZaro.'
                  : 'Select your registered Google account to sign in.'}
              </p>
            </div>

            {/* Error in Google View */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ef233c] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
                {error.includes('already exists') && mode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetMessages();
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-[#ef233c] text-white font-bold text-[11px] hover:bg-[#ff3b53] transition-colors cursor-pointer flex items-center gap-1 font-manrope"
                  >
                    <span>Sign In with this Google Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {error.includes('No account found') && mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      resetMessages();
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white font-bold text-[11px] hover:from-[#ff3b53] hover:to-[#ef233c] transition-colors cursor-pointer flex items-center gap-1 font-manrope"
                  >
                    <span>Sign Up with this Google Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* All Google Accounts Detected (Merged from DB & Browser) */}
            {allGoogleAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-manrope">
                    Choose an account ({allGoogleAccounts.length} available):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(!showCustomGoogleInput)}
                    className="text-[11px] text-[#ef233c] hover:underline cursor-pointer font-medium"
                  >
                    {showCustomGoogleInput ? 'Hide manual input' : '+ Use another Gmail'}
                  </button>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {allGoogleAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleGoogleSubmit(account.email, account.name)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/5 hover:border-[#ef233c]/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/30 to-amber-500/20 text-[#ef233c] border border-red-500/30 font-bold text-xs flex items-center justify-center shrink-0">
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                            {account.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono truncate">{account.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Use Another Google Account Form */}
            {(showCustomGoogleInput || allGoogleAccounts.length === 0) && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGoogleSubmit(customGoogleEmail, customGoogleName);
                }}
                className="space-y-2.5 pt-2 border-t border-white/10"
              >
                <label className="block text-xs font-medium text-zinc-300">
                  {mode === 'signup' ? 'Connect any Gmail Address:' : 'Sign in with any Gmail Address:'}
                </label>
                {mode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                  />
                )}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (allGoogleAccounts.length > 0) {
                        setShowCustomGoogleInput(false);
                      } else {
                        setShowGoogleChooser(false);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white text-xs font-bold font-manrope shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Connecting...' : mode === 'signup' ? 'Create with Google' : 'Sign In with Google'}
                  </button>
                </div>
              </form>
            )}

            {allGoogleAccounts.length > 0 && !showCustomGoogleInput && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowGoogleChooser(false)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to other login methods
                </button>
              </div>
            )}
          </div>
        ) : showDevicePicker ? (
          /* =========================================================================
             VIEW 2: STORED / DEVICE ACCOUNTS
             ========================================================================= */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-[#ef233c]" />
                <h2 className="text-lg font-bold font-manrope text-white">Device & Stored Accounts</h2>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Select an account detected on this device to sign in instantly with unlimited downloads.
            </p>

            {savedAccounts.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedAccounts.map((account) => (
                  <div
                    key={account.email}
                    onClick={() => handleStoredAccountSelect(account)}
                    className="p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/5 hover:border-[#ef233c]/50 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#ef233c]/20 border border-[#ef233c]/40 text-[#ef233c] font-bold text-sm flex items-center justify-center shrink-0">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                          {account.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate">{account.email}</div>
                        <div className="text-[10px] text-zinc-500">@{account.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(e, account.email)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove from device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-center text-xs text-zinc-400">
                No previous accounts remembered on this browser yet. Enter your email below for instant device sign in!
              </div>
            )}

            {/* Quick Email for Device Sign-In */}
            <form onSubmit={handleQuickDeviceEmailSubmit} noValidate className="space-y-2.5 pt-2 border-t border-zinc-800/80">
              <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-manrope">
                Use Any Device Email:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={quickDeviceName}
                  onChange={(e) => setQuickDeviceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                />
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={quickDeviceEmail}
                  onChange={(e) => setQuickDeviceEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDevicePicker(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white text-xs font-bold font-manrope shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In with Email'}
                </button>
              </div>
            </form>
          </div>
        ) : mode === 'forgot' ? (
          /* =========================================================================
             VIEW 3: FORGOT PASSWORD RECOVERY
             ========================================================================= */
          <div className="space-y-4">
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400 uppercase tracking-widest font-manrope mb-3">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password Recovery</span>
              </div>
              <h2 className="text-2xl font-bold font-manrope text-white tracking-tight">Reset Your Password</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose whether to receive the verification OTP on your registered <strong>Gmail</strong> or{' '}
                <strong>Mobile Number</strong>.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ef233c] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
                {error.includes('No account found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      resetMessages();
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white font-bold text-[11px] hover:from-[#ff3b53] hover:to-[#ef233c] transition-colors cursor-pointer flex items-center gap-1 font-manrope"
                  >
                    <span>Create an Account Instead</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {!forgotOtpSent ? (
              /* Step 1: Identifier Input & Send Reset Code */
              <form onSubmit={handleForgotLookupChannels} noValidate className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Enter Registered Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. abhi16shek2006@gmail.com or iq.abhi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Sending Reset Code...' : 'Send Reset Code to Email'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Step 2: Enter OTP & New Password */
              <form onSubmit={handleForgotResetPassword} noValidate className="space-y-3">
                {forgotDevOtpCode && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-400">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>OTP Code: <span className="font-mono text-sm tracking-widest text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">{forgotDevOtpCode}</span></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForgotOtpCode(forgotDevOtpCode)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                    <div className="text-[10px] text-amber-300/80">
                      ⚡ Local Mode: To deliver real OTPs to your Gmail inbox, add <span className="font-mono bg-black/40 px-1 py-0.5 rounded">SMTP_USER</span> and App Password in <span className="font-mono bg-black/40 px-1 py-0.5 rounded">backend/.env</span>.
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-300">
                      Enter 6-Digit OTP sent to{' '}
                      <strong className="text-white">
                        {forgotDiscovered?.masked_email || forgotDiscovered?.email || forgotIdentifier || 'Email'}
                      </strong>
                    </label>
                    {resendCooldown > 0 ? (
                      <span className="text-[10px] text-zinc-500">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleForgotSendOtp}
                        className="text-[10px] text-[#ef233c] hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-lg tracking-widest font-mono text-center focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Set New Password <span className="text-[#ef233c]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOtpSent(false);
                      resetMessages();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-zinc-300 font-semibold cursor-pointer"
                  >
                    Resend / Change
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white text-xs font-bold font-manrope shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Set Password & Login'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetMessages();
                }}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW 4: MAIN AUTH (SIGN IN OR SIGN UP)
             ========================================================================= */
          <div className="space-y-4">
            {/* Header / Tabs */}
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/30 text-[11px] font-bold text-red-200 uppercase tracking-widest font-manrope mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
                <span>Universal Stream Access</span>
              </div>
              <h2 className="text-2xl font-bold font-manrope text-white tracking-tight">
                {mode === 'signin' ? 'Welcome Back to DownZaro' : 'Create DownZaro Account'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'signin'
                  ? 'Access your unlimited 4K downloads, saved history, and preferences.'
                  : 'Get free, unlimited 4K video and lossless audio downloads across all platforms.'}
              </p>
            </div>

            {/* Error Banner with Direct Switch Buttons */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#ef233c] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
                {error.includes('already exists') && mode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setIdentifier(signupEmail || signupUsername);
                      resetMessages();
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-[#ef233c] text-white font-bold text-[11px] hover:bg-[#ff3b53] transition-colors cursor-pointer flex items-center gap-1 font-manrope"
                  >
                    <span>Sign In to Existing Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {error.includes('No account found') && mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setSignupEmail(identifier.includes('@') ? identifier : '');
                      setSignupUsername(!identifier.includes('@') ? identifier : '');
                      resetMessages();
                    }}
                    className="self-start px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white font-bold text-[11px] hover:from-[#ff3b53] hover:to-[#ef233c] transition-colors cursor-pointer flex items-center gap-1 font-manrope"
                  >
                    <span>Create a Free Account Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-900/80 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  resetMessages();
                }}
                className={`py-2 rounded-xl text-xs font-bold font-manrope transition-all cursor-pointer ${
                  mode === 'signin' ? 'bg-[#ef233c] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  resetMessages();
                }}
                className={`py-2 rounded-xl text-xs font-bold font-manrope transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-[#ef233c] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google Mail Connect Button */}
            <button
              type="button"
              onClick={() => {
                setShowGoogleChooser(true);
                resetMessages();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold font-manrope shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-zinc-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Google Mail' : 'Continue with Google Mail'}</span>
            </button>

            {/* Quick Device Email / Stored Account Selector Button */}
            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowDevicePicker(true);
                  resetMessages();
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-white/5 cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5 text-[#ef233c]" />
                <span>Sign in with Device Account ({savedAccounts.length} saved)</span>
              </button>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-zinc-950 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-manrope">
                Or with Credentials
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* ----------------------------------------------------
                SIGN IN MODES (Password / OTP Code / Passkey)
                ---------------------------------------------------- */}
            {mode === 'signin' ? (
              <div className="space-y-3">
                {/* Method selector pills */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      resetMessages();
                    }}
                    className={`px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                      loginMethod === 'password'
                        ? 'bg-white/15 border-white/30 text-white font-semibold'
                        : 'border-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('passkey');
                      resetMessages();
                    }}
                    className={`px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      loginMethod === 'passkey'
                        ? 'bg-white/15 border-white/30 text-white font-semibold'
                        : 'border-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-[#ef233c]" />
                    Passkey
                  </button>
                </div>

                {/* 1. PASSWORD SIGN IN */}
                {loginMethod === 'password' && (
                  <form onSubmit={handlePasswordLogin} noValidate className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Email, Username, or Phone
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          name="username"
                          id="signin-identifier"
                          autoComplete="username email tel"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="e.g. iq.abhi or abhi16shek2006@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-zinc-300">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setForgotIdentifier(identifier);
                            resetMessages();
                          }}
                          className="text-[11px] text-[#ef233c] hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          id="signin-password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 3. PASSKEY LOGIN */}
                {loginMethod === 'passkey' && (
                  <div className="py-4 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-[#ef233c]">
                      <Fingerprint className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="text-xs text-zinc-400">
                      Sign in with Touch ID, Face ID, or Windows Hello stored on your device.
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        resetMessages();
                        setIsSubmitting(true);
                        try {
                          await auth.loginWithPasskey();
                          onClose();
                        } catch (err: any) {
                          setError(err.message || 'Passkey login failed.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] text-white text-xs font-bold shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying Biometrics...' : 'Use Passkey on This Device'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ----------------------------------------------------
                 SIGN UP FORM
                 ---------------------------------------------------- */
              <form onSubmit={handleRegister} noValidate className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Full Name <span className="text-[#ef233c]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Abhishek Thakur"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Username <span className="text-[#ef233c]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">@</span>
                      <input
                        type="text"
                        required
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="iq.abhi"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Email Address <span className="text-[#ef233c]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Mobile Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Create Password <span className="text-[#ef233c]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-8 pr-9 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Register & Start Unlimited Downloads'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Bottom Security Assurance */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ef233c]" />
                <span>Encrypted in PostgreSQL</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Unlimited 4K & MP3</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
