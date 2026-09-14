import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldCheck, UserCheck, Sparkles, Check } from 'lucide-react';

export const GoogleAuthModal: React.FC = () => {
  const { showGoogleModal, setShowGoogleModal, loginWithGoogle, currentUser } = useAuth();
  const [email, setEmail] = useState('jebas.modder@gmail.com');
  const [name, setName] = useState('Jebas Railway Modder');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!showGoogleModal) return null;

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      loginWithGoogle(email, name);
      setIsSubmitting(false);
    }, 600);
  };

  const handleQuickDemoUser = (demoName: string, demoEmail: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      loginWithGoogle(demoEmail, demoName);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
      <div className="google-auth-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn-modal-close"
          onClick={() => setShowGoogleModal(false)}
          title="Close modal"
        >
          <X size={18} />
        </button>

        {/* Google Header */}
        <div className="google-card-header">
          <svg className="google-logo" viewBox="0 0 48 48" width="40" height="40">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <h2 className="google-title">Sign in with Google</h2>
          <p className="google-subtitle">
            Connect your Google account to receive your personal <strong>User ID</strong>, purchase and unlock nameboard templates, and save creations into <strong>My Store</strong>.
          </p>
        </div>

        {/* Google User Profile Form */}
        <form onSubmit={handleGoogleSubmit} className="google-auth-form">
          <div className="google-input-group">
            <label>Google Account Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              required
            />
          </div>

          <div className="google-input-group">
            <label>Google Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gmail.com"
              required
            />
          </div>

          {/* User ID Preview Badge */}
          <div className="user-id-preview-box">
            <UserCheck size={14} style={{ color: 'var(--rail-accent)' }} />
            <span>Automatic User ID will be assigned: <strong>{currentUser?.userId || 'USR-XXXX'}</strong></span>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="submit"
            className="btn-google-signin"
            disabled={isSubmitting}
          >
            <svg viewBox="0 0 48 48" width="18" height="18">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{isSubmitting ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>
        </form>

        {/* Quick 1-Click User Profiles */}
        <div className="demo-accounts-row">
          <span className="demo-label">Quick Sign-In Accounts:</span>
          <div className="demo-pills">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemoUser('Jebas Railway Modder', 'jebas.modder@gmail.com')}
            >
              Jebas (Primary User)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemoUser('IR Simulator Fan', 'simulator.ir@gmail.com')}
            >
              Trainz Enthusiast
            </button>
          </div>
        </div>

        <div className="google-footer-security">
          <ShieldCheck size={13} />
          <span>Secured Google Session · Stores purchases under your User ID</span>
        </div>
      </div>
    </div>
  );
};

