import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleUserProfile, BoardTemplate } from '../types/template';

export type UserRole = 'user' | 'admin';
export type AuthModalTab = 'login' | 'register';

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  loginAsAdmin: (passcode: string) => boolean;
  logoutAdmin: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  adminPasscode: string;
  setAdminPasscode: (pass: string) => void;

  // User Authentication & Account System (MSTS Store Compatible)
  currentUser: GoogleUserProfile | null;
  showGoogleModal: boolean;
  setShowGoogleModal: (show: boolean) => void;
  authModalTab: AuthModalTab;
  setAuthModalTab: (tab: AuthModalTab) => void;
  openGoogleModal: (tab?: AuthModalTab | any) => void;
  openAuthModal: (tab?: AuthModalTab | any) => void;
  loginWithGoogle: (email: string, name: string, avatarUrl?: string) => Promise<GoogleUserProfile>;
  loginUser: (emailOrUserId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => void;

  // Template Store Purchase & Access Gating
  showPurchaseModal: boolean;
  setShowPurchaseModal: (show: boolean) => void;
  selectedPurchaseTemplate: BoardTemplate | null;
  setSelectedPurchaseTemplate: (tpl: BoardTemplate | null) => void;
  openPurchaseModal: (template: BoardTemplate) => void;
  isTemplateUnlocked: (templateId: string, isPaid?: boolean) => boolean;
  unlockTemplateForUser: (templateId: string, orderId?: string, referenceId?: string, amount?: number, paymentMode?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'gjs_board_admin_authenticated';
const ADMIN_PASSCODE_KEY = 'gjs_board_admin_passcode';
const DEFAULT_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123';
const USER_STORAGE_KEY = 'gjs_railway_user_profile_v4';
const GUEST_PURCHASES_KEY = 'gjs_guest_purchased_templates_v4';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('user');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('login');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPurchaseTemplate, setSelectedPurchaseTemplate] = useState<BoardTemplate | null>(null);

  const [adminPasscode, setAdminPasscodeState] = useState<string>(() => {
    return localStorage.getItem(ADMIN_PASSCODE_KEY) || DEFAULT_PASSCODE;
  });

  // Current logged in user profile (Email/Password or Google)
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('gjs_google_user_profile_v3');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored user profile:', e);
    }
    return null;
  });

  // Admin authentication check on mount
  useEffect(() => {
    const isAuthed = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    if (isAuthed) {
      setRole('admin');
    }
  }, []);

  // Sync purchases from Neon Database when user logs in
  useEffect(() => {
    if (!currentUser?.userId) return;

    const fetchPurchases = async () => {
      try {
        const res = await fetch(`/api/purchases?userId=${encodeURIComponent(currentUser.userId)}`);
        if (res.ok) {
          const remoteIds: string[] = await res.json();
          if (Array.isArray(remoteIds) && remoteIds.length > 0) {
            setCurrentUser((prev) => {
              if (!prev) return null;
              const merged = Array.from(new Set([...(prev.purchasedTemplateIds || []), ...remoteIds]));
              const updated = { ...prev, purchasedTemplateIds: merged };
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Neon purchases sync skipped:', err);
      }
    };

    fetchPurchases();
  }, [currentUser?.userId]);

  const loginAsAdmin = (passcode: string): boolean => {
    if (passcode.trim() === adminPasscode.trim()) {
      setRole('admin');
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      setShowLoginModal(false);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setRole('user');
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const setAdminPasscode = (newPass: string) => {
    setAdminPasscodeState(newPass);
    localStorage.setItem(ADMIN_PASSCODE_KEY, newPass);
  };

  // Helper to get local guest purchases
  const getGuestPurchases = (): string[] => {
    try {
      const raw = localStorage.getItem(GUEST_PURCHASES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  // 1. REGISTER USER (Create Account)
  const registerUser = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, message: data.error || 'Registration failed. Please try again.' };
      }

      const user: GoogleUserProfile = data.user;
      // Merge any guest purchases
      const guestPurchases = getGuestPurchases();
      user.purchasedTemplateIds = Array.from(new Set([...(user.purchasedTemplateIds || []), ...guestPurchases]));

      setCurrentUser(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setShowGoogleModal(false);
      return { success: true };
    } catch {
      // Offline fallback: create local user
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const offlineUser: GoogleUserProfile = {
        id: `usr_${Date.now()}`,
        userId: `USR-${randomSuffix}`,
        name: name.trim() || email.split('@')[0],
        email: email.trim().toLowerCase(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
        purchasedTemplateIds: getGuestPurchases(),
        createdAt: new Date().toISOString()
      };

      setCurrentUser(offlineUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(offlineUser));
      setShowGoogleModal(false);
      return { success: true };
    }
  };

  // 2. LOGIN USER (Sign In)
  const loginUser = async (
    emailOrUserId: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: emailOrUserId, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, message: data.error || 'Sign In failed. Check credentials.' };
      }

      const user: GoogleUserProfile = data.user;
      const guestPurchases = getGuestPurchases();
      user.purchasedTemplateIds = Array.from(new Set([...(user.purchasedTemplateIds || []), ...guestPurchases]));

      setCurrentUser(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setShowGoogleModal(false);
      return { success: true };
    } catch {
      // Offline fallback: sign in locally
      const offlineUser: GoogleUserProfile = {
        id: `usr_${Date.now()}`,
        userId: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: emailOrUserId.split('@')[0],
        email: emailOrUserId.includes('@') ? emailOrUserId : `${emailOrUserId}@railway.com`,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(emailOrUserId)}`,
        purchasedTemplateIds: getGuestPurchases(),
        createdAt: new Date().toISOString()
      };

      setCurrentUser(offlineUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(offlineUser));
      setShowGoogleModal(false);
      return { success: true };
    }
  };

  // 3. GOOGLE LOGIN HANDLER
  const loginWithGoogle = async (
    email: string,
    name: string,
    avatarUrl?: string
  ): Promise<GoogleUserProfile> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google', name, email, avatarUrl })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        const user: GoogleUserProfile = data.user;
        const guestPurchases = getGuestPurchases();
        user.purchasedTemplateIds = Array.from(new Set([...(user.purchasedTemplateIds || []), ...guestPurchases]));

        setCurrentUser(user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        setShowGoogleModal(false);
        return user;
      }
    } catch (e) {
      console.warn('API /auth google error, falling back locally:', e);
    }

    // Local fallback
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const profile: GoogleUserProfile = {
      id: 'g_' + Date.now(),
      userId: currentUser?.userId || `USR-${randomSuffix}`,
      name: name || 'Railway Enthusiast',
      email: email || 'user@gmail.com',
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      purchasedTemplateIds: currentUser?.purchasedTemplateIds || getGuestPurchases(),
      createdAt: currentUser?.createdAt || new Date().toISOString()
    };

    setCurrentUser(profile);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    setShowGoogleModal(false);
    return profile;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('gjs_google_user_profile_v3');
  };

  // Check if template is unlocked for this user
  const isTemplateUnlocked = (templateId: string, isPaid?: boolean): boolean => {
    // Admin has access to all templates
    if (role === 'admin') return true;

    // Free templates are always unlocked
    if (!isPaid) return true;

    // Check user's purchased templates
    if (currentUser?.purchasedTemplateIds?.includes(templateId)) {
      return true;
    }

    // Check guest purchases
    const guestIds = getGuestPurchases();
    if (guestIds.includes(templateId)) return true;

    return false;
  };

  // Unlock / purchase template for user & sync with Neon PostgreSQL
  const unlockTemplateForUser = async (
    templateId: string,
    orderId?: string,
    referenceId?: string,
    amount?: number,
    paymentMode?: string
  ): Promise<boolean> => {
    // If user is logged in:
    if (currentUser) {
      const updatedPurchases = Array.from(
        new Set([...(currentUser.purchasedTemplateIds || []), templateId])
      );
      const updatedUser: GoogleUserProfile = {
        ...currentUser,
        purchasedTemplateIds: updatedPurchases
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      // Sync to Neon PostgreSQL user_purchases table
      try {
        fetch('/api/purchases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.userId,
            templateId,
            orderId: orderId || `ord_${Date.now()}`,
            referenceId: referenceId || `cf_${Date.now()}`,
            amount: amount || 99,
            paymentMode: paymentMode || 'Cashfree'
          })
        }).catch((err) => console.warn('Neon sync background notice:', err));
      } catch {}
    }

    // Also persist in guest storage as fallback
    try {
      const raw = localStorage.getItem(GUEST_PURCHASES_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (!ids.includes(templateId)) {
        ids.push(templateId);
        localStorage.setItem(GUEST_PURCHASES_KEY, JSON.stringify(ids));
      }
    } catch (e) {
      console.warn('Failed to save guest purchase:', e);
    }

    setShowPurchaseModal(false);
    setSelectedPurchaseTemplate(null);
    return true;
  };

  const openGoogleModal = (tab?: AuthModalTab | any) => {
    setAuthModalTab(tab === 'register' ? 'register' : 'login');
    setShowGoogleModal(true);
  };

  const openAuthModal = (tab?: AuthModalTab | any) => {
    setAuthModalTab(tab === 'register' ? 'register' : 'login');
    setShowGoogleModal(true);
  };

  const openPurchaseModal = (template: BoardTemplate) => {
    setSelectedPurchaseTemplate(template);
    setShowPurchaseModal(true);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAdmin: role === 'admin',
        loginAsAdmin,
        logoutAdmin,
        showLoginModal,
        setShowLoginModal,
        adminPasscode,
        setAdminPasscode,

        currentUser,
        showGoogleModal,
        setShowGoogleModal,
        authModalTab,
        setAuthModalTab,
        openGoogleModal,
        openAuthModal,
        loginWithGoogle,
        loginUser,
        registerUser,
        logoutUser,

        showPurchaseModal,
        setShowPurchaseModal,
        selectedPurchaseTemplate,
        setSelectedPurchaseTemplate,
        openPurchaseModal,
        isTemplateUnlocked,
        unlockTemplateForUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
