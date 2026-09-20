import { useState, useEffect, useCallback } from 'react';
import { WelcomeBannerData } from '../components/ui/WelcomeBanner';

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  created_at?: string;
}

export interface SavedAccount {
  name: string;
  email: string;
  username: string;
  phone?: string | null;
  lastUsed: number;
}

const TOKEN_KEY = 'downzaro_auth_token';
const SAVED_ACCOUNTS_KEY = 'downzaro_saved_device_accounts';
const GUEST_DOWNLOADS_KEY = 'downzaro_guest_downloads_count';
export const GUEST_DOWNLOAD_LIMIT = 3;

export function getGuestDownloadsCount(): number {
  try {
    const raw = localStorage.getItem(GUEST_DOWNLOADS_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function incrementGuestDownloads(): number {
  try {
    const current = getGuestDownloadsCount();
    const next = current + 1;
    localStorage.setItem(GUEST_DOWNLOADS_KEY, next.toString());
    return next;
  } catch {
    return 1;
  }
}

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAccountToDevice(account: { name: string; email: string; username: string; phone?: string | null }) {
  try {
    const existing = getSavedAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase() && a.username.toLowerCase() !== account.username.toLowerCase()
    );
    const updated: SavedAccount[] = [
      {
        name: account.name,
        email: account.email,
        username: account.username,
        phone: account.phone,
        lastUsed: Date.now(),
      },
      ...existing,
    ].slice(0, 5);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeSavedAccountFromDevice(email: string) {
  try {
    const updated = getSavedAccounts().filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {}
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [welcomeBannerData, setWelcomeBannerData] = useState<WelcomeBannerData | null>(null);
  const [guestCount, setGuestCount] = useState<number>(getGuestDownloadsCount());

  const refreshGuestCount = useCallback(() => {
    setGuestCount(getGuestDownloadsCount());
  }, []);

  // Fetch current user if token exists
  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        saveAccountToDevice(data.user);
      } else {
        // Token invalid/expired
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      // Offline/server error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchCurrentUser]);

  // Login via Password (Email, Username, or Phone)
  const loginWithPassword = async (identifier: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Invalid credentials.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    saveAccountToDevice(data.user);
    setWelcomeBannerData({
      name: data.user.name,
      username: data.user.username,
      action: 'signin',
    });
    return data;
  };

  // 1-Click Device Sign In / Stored Account Login or Sign Up
  const loginWithDeviceAccount = async (params: { email: string; name?: string; username?: string }) => {
    const res = await fetch('/api/auth/device-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Device authentication failed.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    saveAccountToDevice(data.user);
    setWelcomeBannerData({
      name: data.user.name,
      username: data.user.username,
      action: data.is_new_user ? 'signup' : 'signin',
    });
    return data;
  };

  // Google Account Sign In / Sign Up
  const googleAuth = async (params: {
    email: string;
    name?: string;
    credential?: string;
    mode: 'signin' | 'signup';
  }) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Google authentication failed.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    saveAccountToDevice(data.user);
    setWelcomeBannerData({
      name: data.user.name,
      username: data.user.username,
      action: params.mode === 'signup' ? 'signup' : 'signin',
    });
    return data;
  };

  // Fetch registered Google/database accounts
  const getRegisteredGoogleAccounts = async () => {
    try {
      const res = await fetch('/api/auth/google/accounts');
      if (res.ok) {
        const data = await res.json();
        return data.accounts || [];
      }
    } catch {
      // ignore
    }
    return [];
  };

  // Register a new user
  const register = async (params: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Registration failed.');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    saveAccountToDevice(data.user);
    setWelcomeBannerData({
      name: data.user.name,
      username: data.user.username,
      action: 'signup',
    });
    return data;
  };

  // Reset password via OTP
  const resetPassword = async (params: {
    destination: string;
    code: string;
    new_password: string;
  }) => {
    const res = await fetch('/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Password reset failed.');
    }
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      saveAccountToDevice(data.user);
      setWelcomeBannerData({
        name: data.user.name,
        username: data.user.username,
        action: 'signin',
      });
    }
    return data;
  };

  // Query OTP Delivery Channels (Email vs Phone)
  const getOtpChannels = async (identifier: string) => {
    const res = await fetch('/api/auth/otp/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Failed to query account channels.');
    }
    return data.channels;
  };

  // Request OTP with explicit channel choice ('email' or 'phone')
  const requestOtp = async (
    destination: string,
    purpose: 'login' | 'register' | 'reset' = 'login',
    channel: 'email' | 'phone' = 'email'
  ) => {
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, purpose, channel }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Failed to send OTP.');
    }
    return data;
  };

  // Verify OTP
  const verifyOtp = async (params: {
    destination: string;
    code: string;
    purpose?: string;
    name?: string;
    username?: string;
    password?: string;
  }) => {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || 'Invalid OTP verification code.');
    }
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      saveAccountToDevice(data.user);
      setWelcomeBannerData({
        name: data.user.name,
        username: data.user.username,
        action: params.purpose === 'signup' ? 'signup' : 'signin',
      });
    }
    return data;
  };

  // Passkey Biometrics
  const loginWithPasskey = async () => {
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = (await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
          },
        })) as PublicKeyCredential | null;

        if (credential) {
          const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          const res = await fetch('/api/auth/passkey/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential_id: credentialId }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Passkey not found.');
          }
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
          saveAccountToDevice(data.user);
          setWelcomeBannerData({
            name: data.user.name,
            username: data.user.username,
            action: 'signin',
          });
          return data;
        }
      }
      throw new Error('No passkey credential received.');
    } catch (e: any) {
      throw new Error(e.message || 'Biometric Passkey login cancelled or unavailable.');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
  };

  return {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    isModalOpen,
    modalMode,
    welcomeBannerData,
    setWelcomeBannerData,
    guestCount,
    guestLimit: GUEST_DOWNLOAD_LIMIT,
    refreshGuestCount,
    incrementGuestDownloads,
    openAuthModal,
    closeAuthModal,
    setModalMode,
    loginWithPassword,
    loginWithDeviceAccount,
    register,
    googleAuth,
    resetPassword,
    getOtpChannels,
    requestOtp,
    verifyOtp,
    getRegisteredGoogleAccounts,
    loginWithPasskey,
    logout,
  };
}
