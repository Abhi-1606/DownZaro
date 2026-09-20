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
  RotateCcw,
  Check,
} from 'lucide-react';
import { useAuth, getSavedAccounts, removeSavedAccountFromDevice, saveAccountToDevice, SavedAccount } from '../../hooks/useAuth';

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
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Multi-Step Sign Up Form State
  const [signupStep, setSignupStep] = useState<'email' | 'otp' | 'details'>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOtpCode, setSignupOtpCode] = useState('');
  const [signupDevOtpCode, setSignupDevOtpCode] = useState<string | null>(null);
  const [signupOtpCooldown, setSignupOtpCooldown] = useState(0);
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot Password State
  const [forgotIdentifier, setForgotIdentifier] = useState('');
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

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSavedAccounts(getSavedAccounts());
      resetMessages();
      setShowDevicePicker(false);
      setIsSubmitting(false);
      setSignupStep('email');
      setSignupOtpCode('');
      setSignupDevOtpCode(null);
      setForgotOtpSent(false);
      setForgotDevOtpCode(null);
    }
  }, [isOpen, initialMode]);

  // Cooldown timers for OTP resends
  useEffect(() => {
    if (signupOtpCooldown > 0) {
      const timer = setTimeout(() => setSignupOtpCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [signupOtpCooldown]);

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
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Multi-Step Sign Up Step 1: Check Email & Send Verification OTP
  const handleSignupEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanEmail = signupEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check if email already exists
      const checkRes = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError('An account already exists with this email address. Please sign in.');
        return;
      }

      // 2. Dispatch OTP code to email
      const otpRes = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: cleanEmail,
          purpose: 'signup',
          channel: 'email',
        }),
      });
      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        throw new Error(otpData.detail || 'Could not send verification code.');
      }

      setSignupDevOtpCode(otpData.dev_code || null);
      setSignupOtpCooldown(60);
      setSignupStep('otp');
      setSuccess(`A 6-digit verification code has been sent to ${cleanEmail}.`);

      // Pre-derive username from email prefix
      const derivedUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '');
      if (!signupUsername) {
        setSignupUsername(derivedUsername);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Multi-Step Sign Up Step 2: Verify OTP
  const handleSignupOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanEmail = signupEmail.trim().toLowerCase();
    const cleanCode = signupOtpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: cleanEmail,
          code: cleanCode,
          purpose: 'signup',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid or expired verification code.');
      }

      setSignupStep('details');
      setSuccess('Email verified successfully! Please set your password to complete registration.');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend Sign Up OTP
  const handleResendSignupOtp = async () => {
    if (signupOtpCooldown > 0) return;
    resetMessages();
    setIsSubmitting(true);
    try {
      const otpRes = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: signupEmail.trim().toLowerCase(),
          purpose: 'signup',
          channel: 'email',
        }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.detail || 'Failed to resend code.');

      setSignupDevOtpCode(otpData.dev_code || null);
      setSignupOtpCooldown(60);
      setSuccess('A new 6-digit verification code has been sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Multi-Step Sign Up Step 3: Complete Registration with Password
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const cleanName = signupName.trim();
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
    if (!signupPassword || signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signupConfirmPassword && signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await auth.register({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: signupPassword,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Stored / Device Account 1-Click Login
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

  // 4. Quick Device Email Sign In
  const handleQuickDeviceEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!quickDeviceEmail.trim() || !quickDeviceEmail.includes('@')) {
      setError('Please enter a valid email address.');
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

  // 5. Forgot Password: Lookup Account & Send Reset OTP to Email
  const handleForgotLookupChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered email or username.');
      return;
    }
    resetMessages();
    setIsSubmitting(true);

    try {
      const cleanId = forgotIdentifier.trim();
      const res = await fetch('/api/auth/otp/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'No account found with this identifier.');
      }

      const targetDestination = data.channels.email || cleanId;
      const otpRes = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: targetDestination,
          purpose: 'reset',
          channel: 'email',
        }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        throw new Error(otpData.detail || 'Failed to send reset code.');
      }

      setForgotOtpSent(true);
      setForgotDevOtpCode(otpData.dev_code || null);
      setResendCooldown(60);
      setSuccess(`A 6-digit reset code has been sent to ${targetDestination}.`);
    } catch (err: any) {
      setError(err.message || 'Lookup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password Submit
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!forgotOtpCode.trim() || forgotOtpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: forgotIdentifier.trim(),
          code: forgotOtpCode.trim(),
          new_password: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password reset failed.');

      if (data.token) {
        localStorage.setItem('downzaro_auth_token', data.token);
        if (data.user) {
          saveAccountToDevice({
            name: data.user.name,
            email: data.user.email,
            username: data.user.username,
            phone: data.user.phone,
          });
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-zinc-950/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-red-950/20 text-white backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
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

        {showDevicePicker ? (
          /* =========================================================================
             VIEW 1: STORED / DEVICE ACCOUNTS
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
             VIEW 2: FORGOT PASSWORD RECOVERY
             ========================================================================= */
          <div className="space-y-4">
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-400 uppercase tracking-widest font-manrope mb-3">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password Recovery</span>
              </div>
              <h2 className="text-2xl font-bold font-manrope text-white tracking-tight">Reset Your Password</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your registered email to receive a secure 6-digit password reset code.
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
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtpCode}
                    onChange={(e) => setForgotOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-center text-lg font-mono tracking-widest focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password & Sign In'}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSubmitting}
                    onClick={handleForgotLookupChannels}
                    className="text-[#ef233c] hover:underline disabled:text-zinc-600 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOtpSent(false);
                      resetMessages();
                    }}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* =========================================================================
             VIEW 3: MAIN AUTHENTICATION (Sign In & Verified Multi-Step Sign Up)
             ========================================================================= */
          <div className="space-y-4">
            {/* Header Title */}
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/30 text-[11px] font-bold text-[#ef233c] uppercase tracking-widest font-manrope mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
                <span>DownZaro Account</span>
              </div>
              <h2 className="text-2xl font-bold font-manrope text-white tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Create Free Account'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {mode === 'signin'
                  ? 'Access your unlimited 4K downloads, saved history, and preferences.'
                  : 'Verify your email to unlock unlimited 4K video and lossless audio downloads.'}
              </p>
            </div>

            {/* Error Banner with Direct Action Buttons */}
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
                    <span>Sign In with this Email Instead</span>
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
                      setSignupStep('email');
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
                  setSignupStep('email');
                  resetMessages();
                }}
                className={`py-2 rounded-xl text-xs font-bold font-manrope transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-[#ef233c] text-white shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Quick Device Email / Stored Account Selector Button */}
            {savedAccounts.length > 0 && mode === 'signin' && (
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

            {/* ----------------------------------------------------
                SIGN IN MODES (Password / Passkey)
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
                          placeholder="e.g. yourname@gmail.com or iq.abhi"
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

                {/* 2. PASSKEY LOGIN */}
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
                 VERIFIED SIGN UP FLOW (No account picker, verified email -> OTP -> Password)
                 ---------------------------------------------------- */
              <div className="space-y-4">
                {/* Step Indicators */}
                <div className="flex items-center justify-between px-2 pt-1 pb-2">
                  {/* Step 1 */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                        signupStep === 'email'
                          ? 'bg-[#ef233c] text-white ring-4 ring-[#ef233c]/20'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {signupStep === 'email' ? '1' : <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <span className={`font-semibold ${signupStep === 'email' ? 'text-white' : 'text-zinc-400'}`}>
                      Email
                    </span>
                  </div>

                  <div className="flex-1 h-0.5 mx-2 bg-zinc-800" />

                  {/* Step 2 */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                        signupStep === 'otp'
                          ? 'bg-[#ef233c] text-white ring-4 ring-[#ef233c]/20'
                          : signupStep === 'details'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {signupStep === 'details' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : '2'}
                    </div>
                    <span className={`font-semibold ${signupStep === 'otp' ? 'text-white' : 'text-zinc-500'}`}>
                      Verify
                    </span>
                  </div>

                  <div className="flex-1 h-0.5 mx-2 bg-zinc-800" />

                  {/* Step 3 */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                        signupStep === 'details'
                          ? 'bg-[#ef233c] text-white ring-4 ring-[#ef233c]/20'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      3
                    </div>
                    <span className={`font-semibold ${signupStep === 'details' ? 'text-white' : 'text-zinc-500'}`}>
                      Password
                    </span>
                  </div>
                </div>

                {/* ==============================================================
                    SIGN UP STEP 1: Enter Email & Check Existence
                    ============================================================== */}
                {signupStep === 'email' && (
                  <form onSubmit={handleSignupEmailSubmit} noValidate className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Gmail or Email Address <span className="text-[#ef233c]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-sm focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        We will check if an account exists and send a 6-digit verification code to this address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Checking & Sending Code...' : 'Send Verification Code'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* ==============================================================
                    SIGN UP STEP 2: Enter 6-digit Verification Code (OTP)
                    ============================================================== */}
                {signupStep === 'otp' && (
                  <form onSubmit={handleSignupOtpSubmit} noValidate className="space-y-3">
                    {signupDevOtpCode && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-amber-400">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>
                              Verification Code:{' '}
                              <span className="font-mono text-sm tracking-widest text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
                                {signupDevOtpCode}
                              </span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSignupOtpCode(signupDevOtpCode)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 transition-colors cursor-pointer"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-zinc-300">
                          Enter 6-Digit Code sent to <span className="font-mono text-white">{signupEmail}</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={signupOtpCode}
                        onChange={(e) => setSignupOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-center text-xl font-mono tracking-widest focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Verifying Code...' : 'Verify Code & Proceed'}
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        type="button"
                        disabled={signupOtpCooldown > 0 || isSubmitting}
                        onClick={handleResendSignupOtp}
                        className="text-[#ef233c] hover:underline disabled:text-zinc-600 cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{signupOtpCooldown > 0 ? `Resend in ${signupOtpCooldown}s` : 'Resend Code'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('email');
                          setSignupOtpCode('');
                          resetMessages();
                        }}
                        className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        ← Change Email
                      </button>
                    </div>
                  </form>
                )}

                {/* ==============================================================
                    SIGN UP STEP 3: Create Name & Password
                    ============================================================== */}
                {signupStep === 'details' && (
                  <form onSubmit={handleCompleteSignup} noValidate className="space-y-3 animate-in fade-in duration-200">
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Verified: <strong className="font-mono text-white">{signupEmail}</strong></span>
                    </div>

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
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="e.g. Abhishek Thakur"
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

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Create Password <span className="text-[#ef233c]">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-8 pr-9 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Confirm Password <span className="text-[#ef233c]">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:border-[#ef233c] focus:outline-none focus:ring-1 focus:ring-[#ef233c]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#ef233c] to-[#d90429] hover:from-[#ff3b53] hover:to-[#ef233c] text-white text-sm font-bold font-manrope shadow-lg shadow-[#ef233c]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating Account...' : 'Complete Sign Up & Unlock Unlimited'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom Security Assurance */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ef233c]" />
                <span>Encrypted Credentials</span>
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
