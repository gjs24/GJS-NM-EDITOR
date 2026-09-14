import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleUserProfile, BoardTemplate } from '../types/template';

export type UserRole = 'user' | 'admin';

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  loginAsAdmin: (passcode: string) => boolean;
  logoutAdmin: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  adminPasscode: string;
  setAdminPasscode: (pass: string) => void;

  // Google User Authentication
  currentUser: GoogleUserProfile | null;
  showGoogleModal: boolean;
  setShowGoogleModal: (show: boolean) => void;
  openGoogleModal: () => void;
  loginWithGoogle: (email: string, name: string, avatarUrl?: string) => GoogleUserProfile;
  logoutUser: () => void;

  // Template Store Purchase & Access Gating
  showPurchaseModal: boolean;
  setShowPurchaseModal: (show: boolean) => void;
  selectedPurchaseTemplate: BoardTemplate | null;
  setSelectedPurchaseTemplate: (tpl: BoardTemplate | null) => void;
  openPurchaseModal: (template: BoardTemplate) => void;
  isTemplateUnlocked: (templateId: string, isPaid?: boolean) => boolean;
  unlockTemplateForUser: (templateId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'gjs_board_admin_authenticated';
const ADMIN_PASSCODE_KEY = 'gjs_board_admin_passcode';
const DEFAULT_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123';
const GOOGLE_USER_STORAGE_KEY = 'gjs_google_user_profile_v3';
const GUEST_PURCHASES_KEY = 'gjs_guest_purchased_templates_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('user');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPurchaseTemplate, setSelectedPurchaseTemplate] = useState<BoardTemplate | null>(null);

  const [adminPasscode, setAdminPasscodeState] = useState<string>(() => {
    return localStorage.getItem(ADMIN_PASSCODE_KEY) || DEFAULT_PASSCODE;
  });

  // Current logged in Google user
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(GOOGLE_USER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading google user:', e);
    }
    return null;
  });

  useEffect(() => {
    // Check if previously logged in as admin
    const isAuthed = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    if (isAuthed) {
      setRole('admin');
    }
  }, []);

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

  // Google Login handler
  const loginWithGoogle = (email: string, name: string, avatarUrl?: string): GoogleUserProfile => {
    // Generate or maintain stable User ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedUserId = `USR-${randomSuffix}`;

    // Read any existing guest purchases to merge
    let existingPurchases: string[] = [];
    try {
      const guestPurchases = localStorage.getItem(GUEST_PURCHASES_KEY);
      if (guestPurchases) existingPurchases = JSON.parse(guestPurchases);
    } catch {}

    const profile: GoogleUserProfile = {
      id: 'g_' + Date.now(),
      userId: currentUser?.userId || generatedUserId,
      name: name || 'Railway Enthusiast',
      email: email || 'user@gmail.com',
      avatarUrl:
        avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      purchasedTemplateIds: currentUser?.purchasedTemplateIds || existingPurchases,
      createdAt: currentUser?.createdAt || new Date().toISOString()
    };

    setCurrentUser(profile);
    localStorage.setItem(GOOGLE_USER_STORAGE_KEY, JSON.stringify(profile));
    setShowGoogleModal(false);
    return profile;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(GOOGLE_USER_STORAGE_KEY);
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
    try {
      const guest = localStorage.getItem(GUEST_PURCHASES_KEY);
      if (guest) {
        const ids: string[] = JSON.parse(guest);
        if (ids.includes(templateId)) return true;
      }
    } catch {}

    return false;
  };

  // Unlock / purchase template for user
  const unlockTemplateForUser = (templateId: string): boolean => {
    // If user is logged in:
    if (currentUser) {
      const updatedPurchases = Array.from(
        new Set([...currentUser.purchasedTemplateIds, templateId])
      );
      const updatedUser: GoogleUserProfile = {
        ...currentUser,
        purchasedTemplateIds: updatedPurchases
      };
      setCurrentUser(updatedUser);
      localStorage.setItem(GOOGLE_USER_STORAGE_KEY, JSON.stringify(updatedUser));
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

  const openGoogleModal = () => {
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
        openGoogleModal,
        loginWithGoogle,
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
