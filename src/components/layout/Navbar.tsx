import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, LogOut, Train, HelpCircle, Store, BookmarkPlus } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'editor' | 'admin';
  activeStoreTab?: 'store' | 'my-store';
  savedBoardsCount?: number;
  onNavigateHome: () => void;
  onNavigateStore?: (tab: 'store' | 'my-store') => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  activeStoreTab = 'store',
  savedBoardsCount = 0,
  onNavigateHome,
  onNavigateStore,
  onOpenHelp
}) => {
  const { role, isAdmin, setShowLoginModal, logoutAdmin, currentUser, logoutUser, openGoogleModal } = useAuth();

  const handleGoStore = (tab: 'store' | 'my-store') => {
    if (onNavigateStore) {
      onNavigateStore(tab);
    } else {
      onNavigateHome();
    }
  };

  return (
    <header className="main-navbar">
      <div className="navbar-brand" onClick={() => handleGoStore('store')} style={{ cursor: 'pointer' }} title="Go to Template Store">
        <div className="brand-logo-icon">
          <Train size={20} />
        </div>
        <div className="brand-titles">
          <h1>GJS Railway Board Studio</h1>
          <span className="online-tag">Online Edition</span>
        </div>
      </div>

      <div className="navbar-controls">
        {/* Easy Access: Template Store & My Store buttons */}
        {!isAdmin && (
          <div className="nav-store-group">
            <button
              type="button"
              className={`btn-nav-switch ${currentView === 'home' && activeStoreTab === 'store' ? 'active-home' : ''}`}
              onClick={() => handleGoStore('store')}
              title="Browse All Name Boards & Simulator Textures"
            >
              <Store size={14} /> Template Store
            </button>
            <button
              type="button"
              className={`btn-nav-switch ${currentView === 'home' && activeStoreTab === 'my-store' ? 'active-home' : ''}`}
              onClick={() => handleGoStore('my-store')}
              title="Access your saved creations in My Store"
            >
              <BookmarkPlus size={14} /> My Store {savedBoardsCount > 0 && <span className="nav-store-badge">{savedBoardsCount}</span>}
            </button>
          </div>
        )}

        {/* Role status pill */}
        <div className={`role-indicator ${role}`}>
          {isAdmin ? (
            <>
              <ShieldCheck size={14} />
              <span>Admin Mode (Template Creator)</span>
            </>
          ) : (
            <>
              <UserCheck size={14} />
              <span>User Mode (Content Only)</span>
            </>
          )}
        </div>

        {/* Help button */}
        <button
          type="button"
          className="btn-nav-icon"
          onClick={onOpenHelp}
          title="How it works (Admin vs User guide)"
        >
          <HelpCircle size={16} />
        </button>

        {/* Railway User Profile or Sign In / Register */}
        {currentUser ? (
          <div className="nav-user-profile" title={`Signed in as ${currentUser.name} (${currentUser.email}) · User ID: ${currentUser.userId}`}>
            <div className="user-avatar-circle" style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, borderWidth: 1 }}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                />
              ) : (
                <span>{currentUser.name.charAt(0)}</span>
              )}
            </div>
            <div className="nav-user-info">
              <span className="nav-user-name">{currentUser.name.split(' ')[0]}</span>
              <span className="nav-user-id-badge" title="Unique Store User ID">{currentUser.userId}</span>
            </div>
            <button
              type="button"
              className="btn-nav-user-logout"
              onClick={logoutUser}
              title="Sign out of Account"
            >
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-nav-google-login"
            onClick={() => openGoogleModal()}
            title="Sign in or Create Account to get permanent User ID and save purchases"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign In / Register</span>
          </button>
        )}

        {/* Admin Login / Logout Switcher */}
        {isAdmin ? (
          <button
            type="button"
            className="btn-nav-switch admin-active"
            onClick={logoutAdmin}
            title="Switch back to standard User content mode"
          >
            <LogOut size={14} /> Switch to User View
          </button>
        ) : (
          <button
            type="button"
            className="btn-nav-switch"
            onClick={() => setShowLoginModal(true)}
            title="Access Admin Template Studio"
          >
            <ShieldCheck size={14} /> Admin Login
          </button>
        )}
      </div>
    </header>
  );
};
