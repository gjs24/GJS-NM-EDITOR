import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, X, KeyRound, AlertCircle } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, loginAsAdmin } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the admin passcode.');
      return;
    }

    const success = loginAsAdmin(passcode);
    if (!success) {
      setError('Invalid passcode. Please try again.');
    } else {
      setPasscode('');
      setError(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Admin Access Portal</h3>
              <p>Login to design, configure & post railway name board templates.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setShowLoginModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-input-group">
            <label htmlFor="admin-pass-input">
              <KeyRound size={14} /> Admin Passcode
            </label>
            <input
              id="admin-pass-input"
              type="password"
              autoFocus
              placeholder="Enter administrator passcode"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(null);
              }}
            />
          </div>

          {error && (
            <div className="modal-error-message">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowLoginModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Authenticate as Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

