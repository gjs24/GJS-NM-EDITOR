import React, { useState } from 'react';
import { useAuth, AuthModalTab } from '../../context/AuthContext';
import {
  X,
  ShieldCheck,
  UserCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    showGoogleModal,
    setShowGoogleModal,
    authModalTab,
    setAuthModalTab,
    loginUser,
    registerUser,
    loginWithGoogle,
    currentUser
  } = useAuth();

  // Active tab: 'login' | 'register'
  const [tab, setTab] = useState<AuthModalTab>(authModalTab || 'login');

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('jebas.modder@gmail.com');
  const [loginPassword, setLoginPassword] = useState('modder123');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!showGoogleModal) return null;

  // Handle Sign In submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your email or User ID.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(loginIdentifier.trim(), loginPassword);
      if (!result.success) {
        setErrorMsg(result.message || 'Invalid email or password.');
      } else {
        setSuccessMsg('Signed in successfully! Loading your store profile...');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Account submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(regName.trim() || regEmail.split('@')[0], regEmail.trim(), regPassword);
      if (!result.success) {
        setErrorMsg(result.message || 'Registration failed. Email may already be in use.');
      } else {
        setSuccessMsg('Account created successfully! Welcome to GJS Railway Studio.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Users for rapid testing
  const handleQuickDemo = async (demoName: string, demoEmail: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle(demoEmail, demoName);
    } catch {
      // Handled inside
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button
          type="button"
          className="btn-modal-close"
          onClick={() => setShowGoogleModal(false)}
          title="Close window"
        >
          <X size={18} />
        </button>

        {/* Header with Railway Branding */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={24} />
          </div>
          <h2 className="auth-title">Railway Modder Account</h2>
          <p className="auth-subtitle">
            Sign in or create an account to bind your <strong>User ID</strong>, unlock texture sheet templates, and save creations into <strong>My Store</strong>.
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="auth-tabs-row">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            <Lock size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            <User size={13} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Alert feedback message */}
        {errorMsg && (
          <div className="auth-alert-msg error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-alert-msg success">
            <Check size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 1: SIGN IN (LOGIN)
           ------------------------------------------------------------- */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="auth-field-group">
              <label>Email Address or User ID</label>
              <div className="auth-input-container">
                <Mail className="field-icon" size={15} />
                <input
                  type="text"
                  required
                  placeholder="name@example.com or USR-7482"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label>Password</label>
              <div className="auth-input-container">
                <Lock className="field-icon" size={15} />
                <input
                  type={showLoginPwd ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="auth-input has-toggle"
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                  title={showLoginPwd ? 'Hide password' : 'Show password'}
                >
                  {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-btn-submit">
              {loading ? 'Verifying Account...' : 'Sign In to Account'}
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* -------------------------------------------------------------
            TAB 2: CREATE ACCOUNT (REGISTER)
           ------------------------------------------------------------- */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="auth-field-group">
              <label>Full Name / Modder Handle</label>
              <div className="auth-input-container">
                <User className="field-icon" size={15} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jebas Railway Modder"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label>Email Address</label>
              <div className="auth-input-container">
                <Mail className="field-icon" size={15} />
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label>Password (min. 6 characters)</label>
              <div className="auth-input-container">
                <Lock className="field-icon" size={15} />
                <input
                  type={showRegPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Choose a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="auth-input has-toggle"
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowRegPwd(!showRegPwd)}
                  title={showRegPwd ? 'Hide password' : 'Show password'}
                >
                  {showRegPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="auth-field-group">
              <label>Confirm Password</label>
              <div className="auth-input-container">
                <Lock className="field-icon" size={15} />
                <input
                  type={showRegPwd ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Permanent User ID Assigned Preview */}
            <div className="auth-uid-badge">
              <UserCheck size={14} />
              <span>
                Permanent User ID badge will be assigned:{' '}
                <strong>{currentUser?.userId || 'USR-XXXX'}</strong>
              </span>
            </div>

            <button type="submit" disabled={loading} className="auth-btn-submit">
              {loading ? 'Creating Account...' : 'Create Verified Account'}
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider">
          <span />
          OR
          <span />
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={() => handleQuickDemo('Jebas Railway Modder', 'jebas.modder@gmail.com')}
          disabled={loading}
        >
          <svg viewBox="0 0 48 48" width="18" height="18">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Quick Testing User Profiles */}
        <div className="auth-quick-accounts">
          <span className="auth-quick-accounts-label">Instant 1-Click Login:</span>
          <div className="auth-quick-pills">
            <button
              type="button"
              className="auth-pill-btn"
              onClick={() => handleQuickDemo('Jebas Railway Modder', 'jebas.modder@gmail.com')}
            >
              Jebas (Primary)
            </button>
            <button
              type="button"
              className="auth-pill-btn"
              onClick={() => handleQuickDemo('Trainz Enthusiast', 'trainz.fan@gmail.com')}
            >
              Trainz Enthusiast
            </button>
          </div>
        </div>

        {/* Security Seal */}
        <div className="auth-footer-security">
          <ShieldCheck size={13} />
          <span>Neon PostgreSQL Protected · Synchronizes Purchases Across Devices</span>
        </div>
      </div>
    </div>
  );
};
